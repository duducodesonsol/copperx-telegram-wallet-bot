import axios from 'axios';
import { config } from '../config';
import { Transaction } from '../types';

class TransferService {
  async sendToEmail(token: string, email: string, amount: string, message: string = ''): Promise<any> {
    try {
      const response = await axios.post(
        `${config.COPPERX_API_URL}/api/transfers/send`,
        {
          email,
          amount,
          message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending to email:', error);
      throw error;
    }
  }

  async sendToWallet(token: string, walletAddress: string, amount: string, network: string): Promise<any> {
    try {
      const response = await axios.post(
        `${config.COPPERX_API_URL}/api/transfers/wallet-withdraw`,
        {
          walletAddress,
          amount,
          network,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending to wallet:', error);
      throw error;
    }
  }

  async withdrawToBank(token: string, amount: string): Promise<any> {
    try {
      const response = await axios.post(
        `${config.COPPERX_API_URL}/api/transfers/offramp`,
        {
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error withdrawing to bank:', error);
      throw error;
    }
  }

  async getTransactions(token: string, page: number = 1, limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await axios.get(`${config.COPPERX_API_URL}/api/transfers`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }
}

export const transferService = new TransferService();
