import { Context, Markup } from 'telegraf';
import { authService } from '../services/authService';
import { sessionManager } from '../utils/sessionManager';

export const profileHandler = {
  async profileCommand(ctx: Context) {
    const session = sessionManager.getSession(ctx.from!.id);
    if (!session) {
      return ctx.reply('You need to login first. Use /start to begin.');
    }
    
    const profile = await authService.getUserProfile(session.token);
    
    if (!profile) {
      return ctx.reply('Unable to fetch your profile. Please try again later.');
    }
    
    const kycStatus = await authService.getKycStatus(session.token);
    
    let message = '👤 *Your Profile*\n\n';
    message += `Name: ${profile.firstName} ${profile.lastName || ''}\n`;
    message += `Email: ${profile.email}\n`;
    
    if (kycStatus) {
      message += `\n*KYC Status:* ${kycStatus.status}\n`;
      message += `Type: ${kycStatus.type}\n`;
      message += `Last Updated: ${new Date(kycStatus.updatedAt).toLocaleDateString()}\n`;
    } else {
      message += '\n*KYC Status:* Not available\n';
    }
    
    return ctx.reply(message, { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([Markup.button.callback('Back to Menu', 'menu')])
    });
  }
};