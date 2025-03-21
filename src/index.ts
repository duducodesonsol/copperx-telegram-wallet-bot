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
  console.log('Received request:', req.body);
  if (!req.body || !req.body.update_id) {
    res.status(400).send('Invalid request');
    return;
  }
  await bot.handleUpdate(req.body, res);
};

// Register callback query handlers
bot.action('login', (ctx: any) => {
  console.log('Login action triggered');
  ctx.scene.enter('login_wizard');
  return authHandler.loginCallback(ctx);
});

bot.action(/^menu|check_balance|send_money|transaction_history|profile|help$/, (ctx: any) => {
  console.log('Menu action triggered:', ctx.match[0]);
  return menuHandler.handleMenuCallbacks(ctx);
});

bot.action('set_default_wallet', (ctx: any) => {
  console.log('Set default wallet action triggered');
  return walletHandler.setDefaultWalletCallback(ctx);
});

bot.action(/^set_default:(.+)$/, (ctx: any) => {
  console.log('Set default wallet action triggered:', ctx.match[1]);
  return walletHandler.setDefaultWalletAction(ctx);
});

bot.action('send_email', (ctx: any) => {
  console.log('Send email action triggered');
  ctx.scene.enter('send_email_wizard');
  return transferHandler.sendEmailCallback(ctx);
});

bot.action('send_wallet', (ctx: any) => {
  console.log('Send wallet action triggered');
  ctx.scene.enter('send_wallet_wizard');
  return transferHandler.sendWalletCallback(ctx);
});

bot.action('withdraw_bank', (ctx: any) => {
  console.log('Withdraw bank action triggered');
  ctx.scene.enter('withdraw_bank_wizard');
  return transferHandler.withdrawBankCallback(ctx);
});

bot.action(/^network_(.+)$/, (ctx: any) => {
  console.log('Network action triggered:', ctx.match[1]);
  return transferHandler.processWalletNetwork(ctx);
});

bot.action('confirm_email_transfer', (ctx: any) => {
  console.log('Confirm email transfer action triggered');
  return transferHandler.confirmEmailTransfer(ctx);
});

bot.action('confirm_wallet_transfer', (ctx: any) => {
  console.log('Confirm wallet transfer action triggered');
  return transferHandler.confirmWalletTransfer(ctx);
});

bot.action('confirm_bank_withdrawal', (ctx: any) => {
  console.log('Confirm bank withdrawal action triggered');
  return transferHandler.confirmBankWithdrawal(ctx);
});

bot.action('cancel_transfer', (ctx: any) => {
  console.log('Cancel transfer action triggered');
  return transferHandler.cancelTransfer(ctx);
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.');
});

// Set webhook with retry mechanism
const setWebhook = async () => {
  const webhookUrl = `${process.env.VERCEL_URL}/api/webhook`;
  console.log(`Setting webhook to ${webhookUrl}`);
  try {
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Webhook set to ${webhookUrl}`);
  } catch (err) {
    console.error('Failed to set webhook:', err);
    setTimeout(setWebhook, 5000); // Retry after 5 seconds
  }
};

setWebhook();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
