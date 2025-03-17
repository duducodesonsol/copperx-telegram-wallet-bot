import { Context, Markup } from 'telegraf';
import { transferService } from '../services/transferService';
import { sessionManager } from '../utils/sessionManager';

// Store transfer data during multi-step flows
const transferStore: Map<number, any> = new Map();

export const transferHandler = {
  async sendCommand(ctx: Context) {
    const session = sessionManager.getSession(ctx.from!.id);
    if (!session) {
      return ctx.reply('You need to login first. Use /start to begin.');
    }
    
    return ctx.reply(
      '💸 *Send Funds*\n\nHow would you like to send funds?',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Send to Email', 'send_email')],
          [Markup.button.callback('Send to Wallet', 'send_wallet')],
          [Markup.button.callback('Withdraw to Bank', 'withdraw_bank')],
          [Markup.button.callback('Back to Menu', 'menu')]
        ])
      }
    );
  },
  
  async sendEmailCallback(ctx: any) {
    await ctx.answerCbQuery();
    
    transferStore.set(ctx.from.id, { type: 'email' });
    await ctx.reply('Please enter the recipient\'s email address:');
    ctx.wizard.next();
  },
  
  async processEmailRecipient(ctx: any) {
    const email = ctx.message.text;
    
    // Simple email validation
    if (!email.includes('@') || !email.includes('.')) {
      await ctx.reply('Invalid email format. Please try again:');
      return;
    }
    
    const transferData = transferStore.get(ctx.from.id) || {};
    transferData.recipient = email;
    transferStore.set(ctx.from.id, transferData);
    
    await ctx.reply('Please enter the amount to send (in USDC):');
    ctx.wizard.next();
  },
  
  async processEmailAmount(ctx: any) {
    const amount = ctx.message.text;
    
    // Simple amount validation
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      await ctx.reply('Invalid amount. Please enter a positive number:');
      return;
    }
    
    const transferData = transferStore.get(ctx.from.id) || {};
    transferData.amount = amount;
    transferStore.set(ctx.from.id, transferData);
    
    await ctx.reply('Enter an optional message for the recipient (or type "skip"):');
    ctx.wizard.next();
  },
  
  async processEmailMessage(ctx: any) {
    const message = ctx.message.text === 'skip' ? '' : ctx.message.text;
    const transferData = transferStore.get(ctx.from.id) || {};
    transferData.message = message;
    transferStore.set(ctx.from.id, transferData);
    
    const session = sessionManager.getSession(ctx.from.id);
    if (!session) {
      await ctx.reply('Session expired. Please login again.');
      return ctx.scene.leave();
    }
    
    await ctx.reply(
      `*Transfer Summary*\n\nTo: ${transferData.recipient}\nAmount: ${transferData.amount} USDC\nMessage: ${transferData.message || 'None'}\n\nConfirm this transfer?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Confirm', 'confirm_email_transfer')],
          [Markup.button.callback('Cancel', 'cancel_transfer')]
        ])
      }
    );
    ctx.wizard.next();
  },
  
  async confirmEmailTransfer(ctx: any) {
    await ctx.answerCbQuery();
    
    const transferData = transferStore.get(ctx.from.id);
    const session = sessionManager.getSession(ctx.from.id);
    
    if (!transferData || !session) {
      await ctx.reply('Session expired. Please try again.');
      return ctx.scene.leave();
    }
    
    try {
      await transferService.sendToEmail(
        session.token,
        transferData.recipient,
        transferData.amount,
        transferData.message
      );
      
      transferStore.delete(ctx.from.id);
      
      await ctx.reply(
        '✅ Transfer successful! The funds have been sent.',
        Markup.inlineKeyboard([Markup.button.callback('Back to Menu', 'menu')])
      );
      ctx.scene.leave();
    } catch (error) {
      await ctx.reply(
        `❌ Transfer failed: ${(error as Error).message || 'Unknown error'}`,
        Markup.inlineKeyboard([Markup.button.callback('Try Again', 'send_email'), Markup.button.callback('Back to Menu', 'menu')])
      );
      ctx.scene.leave();
    }
  },
  
  async cancelTransfer(ctx: any) {
    await ctx.answerCbQuery();
    
    transferStore.delete(ctx.from.id);
    await ctx.reply(
      'Transfer cancelled.',
      Markup.inlineKeyboard([Markup.button.callback('Back to Menu', 'menu')])
    );
    ctx.scene.leave();
  },
  
  async sendWalletCallback(ctx: any) {
    await ctx.answerCbQuery();
    
    transferStore.set(ctx.from.id, { type: 'wallet' });
    await ctx.reply('Please enter the recipient\'s wallet address:');
    ctx.wizard.next();
  },
  
  async processWalletAddress(ctx: any) {
    const address = ctx.message.text;
    
    // Basic validation - could be enhanced with network-specific checks
    if (address.length < 10) {
      await ctx.reply('Invalid wallet address. Please try again:');
      return;
    }
    
    const transferData = transferStore.get(ctx.from.id) || {};
    transferData.address = address;
    transferStore.set(ctx.from.id, transferData);
    
    await ctx.reply(
      'Select the network:',
      Markup.inlineKeyboard([
        [Markup.button.callback('Solana', 'network_solana')],
        [Markup.button.callback('Ethereum', 'network_ethereum')],
        [Markup.button.callback('Cancel', 'cancel_transfer')]
      ])
    );
    ctx.wizard.next();
  },
  
  async processWalletNetwork(ctx: any) {
    await ctx.answerCbQuery();
    
    const network = ctx.match[1]; // solana, ethereum, etc.
    const transferData = transferStore.get(ctx.from.id) || {};
    transferData.network = network;
    transferStore.set(ctx.from.id, transferData);
    
    await ctx.reply('Please enter the amount to send (in USDC):');
    ctx.wizard.next();
  },
  
  async processWalletAmount(ctx: any) {
    const amount = ctx.message.text;
    
    // Simple amount validation
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      await ctx.reply('Invalid amount. Please enter a positive number:');
      return;
    }
    
    const transferData = transferStore.get(ctx.from.id) || {};
    transferData.amount = amount;
    transferStore.set(ctx.from.id, transferData);
    
    const session = sessionManager.getSession(ctx.from.id);
    if (!session) {
      await ctx.reply('Session expired. Please login again.');
      return ctx.scene.leave();
    }
    
    await ctx.reply(
      `*Transfer Summary*\n\nTo Address: ${transferData.address}\nNetwork: ${transferData.network}\nAmount: ${transferData.amount} USDC\n\nConfirm this transfer?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Confirm', 'confirm_wallet_transfer')],
          [Markup.button.callback('Cancel', 'cancel_transfer')]
        ])
      }
    );
    ctx.wizard.next();
  },
  
  async confirmWalletTransfer(ctx: any) {
    await ctx.answerCbQuery();
    
    const transferData = transferStore.get(ctx.from.id);
    const session = sessionManager.getSession(ctx.from.id);
    
    if (!transferData || !session) {
      await ctx.reply('Session expired. Please try again.');
      return ctx.scene.leave();
    }
    
    try {
      await transferService.sendToWallet(
        session.token,
        transferData.address,
        transferData.amount,
        transferData.network
      );
      
      transferStore.delete(ctx.from.id);
      
      await ctx.reply(
        '✅ Transfer successful! The funds have been sent.',
        Markup.inlineKeyboard([Markup.button.callback('Back to Menu', 'menu')])
      );
      ctx.scene.leave();
    } catch (error) {
      await ctx.reply(
        `❌ Transfer failed: ${(error as Error).message || 'Unknown error'}`,
        Markup.inlineKeyboard([Markup.button.callback('Try Again', 'send_wallet'), Markup.button.callback('Back to Menu', 'menu')])
      );
      ctx.scene.leave();
    }
  },
  
  async withdrawBankCallback(ctx: any) {
    await ctx.answerCbQuery();
    
    transferStore.set(ctx.from.id, { type: 'bank' });
    await ctx.reply('Please enter the amount to withdraw to your bank (in USDC):');
    ctx.wizard.next();
  },
  
  async processBankAmount(ctx: any) {
    const amount = ctx.message.text;
    
    // Simple amount validation
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      await ctx.reply('Invalid amount. Please enter a positive number:');
      return;
    }
    
    const transferData = transferStore.get(ctx.from.id) || {};
    transferData.amount = amount;
    transferStore.set(ctx.from.id, transferData);
    
    const session = sessionManager.getSession(ctx.from.id);
    if (!session) {
      await ctx.reply('Session expired. Please login again.');
      return ctx.scene.leave();
    }
    
    await ctx.reply(
      `*Bank Withdrawal Summary*\n\nAmount: ${transferData.amount} USDC\n\nConfirm this withdrawal?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Confirm', 'confirm_bank_withdrawal')],
          [Markup.button.callback('Cancel', 'cancel_transfer')]
        ])
      }
    );
    ctx.wizard.next();
  },
  
  async confirmBankWithdrawal(ctx: any) {
    await ctx.answerCbQuery();
    
    const transferData = transferStore.get(ctx.from.id);
    const session = sessionManager.getSession(ctx.from.id);
    
    if (!transferData || !session) {
      await ctx.reply('Session expired. Please try again.');
      return ctx.scene.leave();
    }
    
    try {
      await transferService.withdrawToBank(
        session.token,
        transferData.amount
      );
      
      transferStore.delete(ctx.from.id);
      
      await ctx.reply(
        '✅ Withdrawal request submitted successfully!',
        Markup.inlineKeyboard([Markup.button.callback('Back to Menu', 'menu')])
      );
      ctx.scene.leave();
    } catch (error) {
      await ctx.reply(
        `❌ Withdrawal failed: ${(error as Error).message || 'Unknown error'}. Note that there may be a minimum withdrawal amount.`,
        Markup.inlineKeyboard([Markup.button.callback('Try Again', 'withdraw_bank'), Markup.button.callback('Back to Menu', 'menu')])
      );
      ctx.scene.leave();
    }
  },
  
  async transactionsCommand(ctx: Context) {
    const session = sessionManager.getSession(ctx.from!.id);
    if (!session) {
      return ctx.reply('You need to login first. Use /start to begin.');
    }
    
    const transactions = await transferService.getTransactions(session.token, 1, 10);
    
    if (transactions.length === 0) {
      return ctx.reply('No recent transactions found.');
    }
    
    let message = '📊 *Recent Transactions*\n\n';
    
    for (const tx of transactions) {
      const date = new Date(tx.createdAt).toLocaleDateString();
      const type = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
      const status = tx.status.charAt(0).toUpperCase() + tx.status.slice(1);
      
      message += `*${type}* - ${tx.amount} USDC\n`;
      message += `Status: ${status}\n`;
      if (tx.recipient) message += `To: ${tx.recipient}\n`;
      if (tx.network) message += `Network: ${tx.network}\n`;
      message += `Date: ${date}\n\n`;
    }
    
    return ctx.reply(message, { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([Markup.button.callback('Back to Menu', 'menu')])
    });
  }
};