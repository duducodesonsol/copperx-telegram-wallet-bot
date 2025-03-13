import Pusher from 'pusher-js';
import { config } from '../config';
import axios from 'axios';

export class NotificationManager {
  private pusherClient: Pusher | null = null;
  private telegramBot: any;
  private telegramId: number;
  private token: string;
  private organizationId: string;

  constructor(telegramBot: any, telegramId: number, token: string, organizationId: string) {
    this.telegramBot = telegramBot;
    this.telegramId = telegramId;
    this.token = token;
    this.organizationId = organizationId;
  }

  async initialize(): Promise<boolean> {
    try {
      this.pusherClient = new Pusher(config.PUSHER_KEY, {
        cluster: config.PUSHER_CLUSTER,
        authorizer: (channel) => ({
          authorize: async (socketId, callback) => {
            try {
              const response = await axios.post(
                `${config.COPPERX_API_URL}/api/notifications/auth`,
                {
                  socket_id: socketId,
                  channel_name: channel.name,
                },
                {
                  headers: {
                    Authorization: `Bearer ${this.token}`,
                  },
                }
              );

              if (response.data) {
                callback(null, response.data);
              } else {
                callback(new Error('Pusher authentication failed'), null);
              }
            } catch (error) {
              console.error('Pusher authorization error:', error);
              callback(error as Error, null);
            }
          },
        }),
      });

      const channel = this.pusherClient.subscribe(`private-org-${this.organizationId}`);

      channel.bind('pusher:subscription_succeeded', () => {
        console.log('Successfully subscribed to private channel');
      });

      channel.bind('pusher:subscription_error', (error: any) => {
        console.error('Subscription error:', error);
        return false;
      });

      // Bind to the deposit event
      channel.bind('deposit', (data: any) => {
        this.telegramBot.sendMessage(
          this.telegramId,
          `💰 *New Deposit Received*\n\n${data.amount} USDC deposited on ${data.network || 'Solana'}`,
          { parse_mode: 'Markdown' }
        );
      });

      return true;
    } catch (error) {
      console.error('Error initializing notification manager:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.pusherClient) {
      this.pusherClient.disconnect();
      this.pusherClient = null;
    }
  }
}