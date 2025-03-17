import { Context, Markup } from 'telegraf';

export const helpHandler = {
  async helpCommand(ctx: Context) {
    const helpMessage = `
*Copperx Telegram Bot Help*

💰 *Available Commands:*
/start - Begin using the bot or login
/menu - Show the main menu
/balance - View your wallet balances
/send - Send money to email or wallet
/transactions - View recent transactions
/profile - View your account profile
/help - Show this help message
/logout - Sign out from your account

For additional support or questions, please contact:
https://t.me/copperxcommunity/2183
    `;
    
    return ctx.reply(helpMessage, { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([Markup.button.callback('Back to Menu', 'menu')])
    });
  }
};