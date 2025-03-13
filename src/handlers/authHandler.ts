import { Context, Markup } from 'telegraf';
import { authService } from '../services/authService';
import { sessionManager } from '../utils/sessionManager';
import { NotificationManager } from '../utils/notificationManager';

// Store email during OTP flow
const emailStore: Map<number, string> = new Map();

export const authHandler = {
  async startCommand(ctx: Context) {
    if (sessionManager.isAuthenticated(ctx.from!.id)) {
      return ctx.reply('You are already logged in. Use /menu to access functions or /logout to sign out.');
    }
    
    return ctx.reply(
      'Welcome to Copperx Telegram Bot! Please login to access your account.',
      Markup.inlineKeyboard([Markup.button.callback('Login', 'login')])
    );
  },

  async loginCallback(ctx: any) {
    await ctx.answerCbQuery();
    await ctx.reply('Please enter your email address:');
    ctx.wizard.next();
  },

  async processEmail(ctx: any) {
    const email = ctx.message.text;
    
    // Simple email validation
    if (!email.includes('@') || !email.includes('.')) {
      await ctx.reply('Invalid email format. Please try again:');
      return;
    }
    
    emailStore.set(ctx.from.id, email);
    const success = await authService.requestEmailOtp(email);
    
    if (success) {
      await ctx.reply(`OTP has been sent to ${email}. Please enter the code:`);
      ctx.wizard.next();
    } else {
      await ctx.reply('Failed to send OTP. Please try again later.');
      ctx.scene.leave();
    }
  },

  async processOtp(ctx: any) {
    const otp = ctx.message.text;
    const email = emailStore.get(ctx.from.id);
    
    if (!email) {
      await ctx.reply('Session expired. Please start again.');
      return ctx.scene.leave();
    }
    
    const session = await authService.verifyEmailOtp(email, otp);
    
    if (session) {
      sessionManager.saveSession(ctx.from.id, session);
      emailStore.delete(ctx.from.id);
      
      // Initialize notifications
      const notificationManager = new NotificationManager(
        ctx.telegram,
        ctx.from.id,
        session.token,
        session.organizationId
      );
      await notificationManager.initialize();
      
      await ctx.reply(
        '✅ Login successful! Welcome to Copperx.',
        Markup.inlineKeyboard([Markup.button.callback('Go to Menu', 'menu')])
      );
      ctx.scene.leave();
    } else {
      await ctx.reply('Invalid OTP or authentication failed. Please try again.');
    }
  },

  async logoutCommand(ctx: any) {
    if (!sessionManager.isAuthenticated(ctx.from.id)) {
      return ctx.reply('You are not logged in.');
    }
    
    sessionManager.removeSession(ctx.from.id);
    return ctx.reply('You have been logged out. Use /start to login again.');
  },
};