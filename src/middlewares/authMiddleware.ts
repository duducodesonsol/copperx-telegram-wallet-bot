import { Context, Middleware } from 'telegraf';
import { sessionManager } from '../utils/sessionManager';

export const authMiddleware: Middleware<Context> = (ctx, next) => {
  // Skip auth check for start and help commands
  if (ctx.updateType === 'message') {
    const message = ctx.message as any;
    if (message.text && (message.text === '/start' || message.text === '/help')) {
      return next();
    }
  }
  
  // Allow login callback
  if (ctx.updateType === 'callback_query' && (ctx.callbackQuery as any).data === 'login') {
    return next();
  }
  
  // Check if user is authenticated
  if (!sessionManager.isAuthenticated(ctx.from!.id)) {
    return ctx.reply('You need to login first. Use /start to begin.');
  }
  
  return next();
};