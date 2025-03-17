import { Context, Markup } from 'telegraf';

export const menuHandler = {
  async menuCommand(ctx: Context) {
    return ctx.reply(
      '📱 *Copperx Menu*\n\nPlease select an option:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💰 Check Balance', 'check_balance')],
          [Markup.button.callback('💸 Send Money', 'send_money')],
          [Markup.button.callback('📊 Transaction History', 'transaction_history')],
          [Markup.button.callback('👤 My Profile', 'profile')],
          [Markup.button.callback('❓ Help & Support', 'help')]
        ])
      }
    );
  },
  
  async handleMenuCallbacks(ctx: any) {
    await ctx.answerCbQuery();
    
    const action = ctx.match[0];
    
    switch (action) {
      case 'check_balance':
        return walletHandler.balanceCommand(ctx);
      case 'send_money':
        return transferHandler.sendCommand(ctx);
      case 'transaction_history':
        return transferHandler.transactionsCommand(ctx);
      case 'profile':
        return profileHandler.profileCommand(ctx);
      case 'help':
        return helpHandler.helpCommand(ctx);
      case 'menu':
        return menuHandler.menuCommand(ctx);
      default:
        return ctx.reply('Invalid option. Please try again.');
    }
  }
};