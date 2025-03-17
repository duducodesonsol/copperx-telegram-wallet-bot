import { Context, Markup } from 'telegraf';
import { walletService } from '../services/walletService';
import { sessionManager } from '../utils/sessionManager';

export const walletHandler = {
  async balanceCommand(ctx: Context) {
    const session = sessionManager.getSession(ctx.from!.id);
    if (!session) {
      return ctx.reply('You need to login first. Use /start to begin.');
    }

    const balances = await walletService.getBalances(session.token);
    
    if (balances.length === 0) {
      return ctx.reply('No wallets found or unable to fetch balances.');
    }

    let message = '💰 *Your Wallet Balances*\n\n';
    
    for (const balance of balances) {
      message += `*${balance.network}*: ${balance.balance} USDC ${balance.isDefault ? ' (Default)' : ''}\n`;
    }
    
    return ctx.reply(message, { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Set Default Wallet', 'set_default_wallet')],
        [Markup.button.callback('Back to Menu', 'menu')]
      ])
    });
  },

  async setDefaultWalletCallback(ctx: any) {
    await ctx.answerCbQuery();
    
    const session = sessionManager.getSession(ctx.from.id);
    if (!session) {
      return ctx.reply('You need to login first. Use /start to begin.');
    }
    
    const wallets = await walletService.getWallets(session.token);
    
    if (wallets.length === 0) {
      return ctx.reply('No wallets found.');
    }
    
    const buttons = wallets.map((wallet: any) => {
      return [Markup.button.callback(`${wallet.network}`, `set_default:${wallet.id}`)];
    });
    
    buttons.push([Markup.button.callback('Cancel', 'menu')]);
    
    return ctx.reply('Select a wallet to set as default:', Markup.inlineKeyboard(buttons));
  },
  
  async setDefaultWalletAction(ctx: any) {
    await ctx.answerCbQuery();
    
    const walletId = ctx.match[1];
    const session = sessionManager.getSession(ctx.from.id);
    
    if (!session) {
      return ctx.reply('You need to login first. Use /start to begin.');
    }
    
    const success = await walletService.setDefaultWallet(session.token, walletId);
    
    if (success) {
      return ctx.reply(
        '✅ Default wallet updated successfully.',
        Markup.inlineKeyboard([Markup.button.callback('Back to Menu', 'menu')])
      );
    } else {
      return ctx.reply(
        '❌ Failed to update default wallet.',
        Markup.inlineKeyboard([Markup.button.callback('Try Again', 'set_default_wallet'), Markup.button.callback('Back to Menu', 'menu')])
      );
    }
  }
};