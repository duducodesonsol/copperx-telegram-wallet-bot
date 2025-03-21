import { Telegraf, session, Scenes } from 'telegraf';
import { config } from './config';
import { authHandler } from './handlers/authHandler';
import { walletHandler } from './handlers/walletHandler';
import { transferHandler } from './handlers/transferHandler';
import { profileHandler } from './handlers/profileHandler';
import { menuHandler } from './handlers/menuHandler';
import { helpHandler } from './handlers/helpHandler';
import { authMiddleware } from './middlewares/authMiddleware';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Create bot instance
if (!config.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined');
}
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// Use session middleware
bot.use(session());

// Create wizards for multi-step processes
const loginWizard = new Scenes.WizardScene(
  'login_wizard',
  authHandler.processEmail,
  authHandler.processOtp
);

const sendEmailWizard = new Scenes.WizardScene(
  'send_email_wizard',
  transferHandler.processEmailRecipient,
  transferHandler.processEmailAmount,
  transferHandler.processEmailMessage
);

const sendWalletWizard = new Scenes.WizardScene(
  'send_wallet_wizard',
  transferHandler.processWalletAddress,
  transferHandler.processWalletNetwork,
  transferHandler.processWalletAmount
);

const withdrawBankWizard = new Scenes.WizardScene(
  'withdraw_bank_wizard',
  transferHandler.processBankAmount
);

// Create stage and register wizards
const stage = new Scenes.Stage([
  loginWizard,
  sendEmailWizard,
  sendWalletWizard,
  withdrawBankWizard
]);

bot.use(stage.middleware());

// Use auth middleware for protected routes
bot.use(authMiddleware);

// Register command handlers
bot.start(authHandler.startCommand);
bot.command('menu', menuHandler.menuCommand);
bot.command('balance', walletHandler.balanceCommand);
bot.command('send', transferHandler.sendCommand);
bot.command('transactions', transferHandler.transactionsCommand);
bot.command('profile', profileHandler.profileCommand);
bot.command('help', helpHandler.helpCommand);
bot.command('logout', authHandler.logoutCommand);

// Export the bot as a Vercel serverless function
export default async (req: VercelRequest, res: VercelResponse) => {
  await bot.handleUpdate(req.body, res);
};

// Register callback query handlers
bot.action('login', (ctx: any) => {
  ctx.scene.enter('login_wizard');
  return authHandler.loginCallback(ctx);
});

bot.action(/^menu|check_balance|send_money|transaction_history|profile|help$/, menuHandler.handleMenuCallbacks);

bot.action('set_default_wallet', walletHandler.setDefaultWalletCallback);
bot.action(/^set_default:(.+)$/, walletHandler.setDefaultWalletAction);

bot.action('send_email', (ctx: any) => {
  ctx.scene.enter('send_email_wizard');
  return transferHandler.sendEmailCallback(ctx);
});

bot.action('send_wallet', (ctx: any) => {
  ctx.scene.enter('send_wallet_wizard');
  return transferHandler.sendWalletCallback(ctx);
});

bot.action('withdraw_bank', (ctx: any) => {
  ctx.scene.enter('withdraw_bank_wizard');
  return transferHandler.withdrawBankCallback(ctx);
});

bot.action(/^network_(.+)$/, transferHandler.processWalletNetwork);
bot.action('confirm_email_transfer', transferHandler.confirmEmailTransfer);
bot.action('confirm_wallet_transfer', transferHandler.confirmWalletTransfer);
bot.action('confirm_bank_withdrawal', transferHandler.confirmBankWithdrawal);
bot.action('cancel_transfer', transferHandler.cancelTransfer);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.');
});

// Set webhook
const webhookUrl = `${config.VERCEL_URL}/api/webhook`;
bot.telegram.setWebhook(webhookUrl)
  .then(() => {
    console.log(`Webhook set to ${webhookUrl}`);
  })
  .catch((err) => {
    console.error('Failed to set webhook:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
