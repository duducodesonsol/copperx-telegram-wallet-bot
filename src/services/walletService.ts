import axios from 'axios';
import { config } from '../config';
import { WalletBalance } from '../types';

class WalletService {
  async getWallets(token: string): Promise<any[]> {
    try {
      const response = await axios.get(`${config.COPPERX_API_URL}/api/wallets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      return [];
    }
  }

  async getBalances(token: string): Promise<WalletBalance[]> {
    try {
      const response = await axios.get(`${config.COPPERX_API_URL}/api/wallets/balances`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching balances:', error);
      return [];
    }
  }

  async setDefaultWallet(token: string, walletId: string): Promise<boolean> {
    try {
      await axios.put(
        `${config.COPPERX_API_URL}/api/wallets/default`,
        { walletId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return true;
    } catch (error) {
      console.error('Error setting default wallet:', error);
      return false;
    }
  }

  async getDefaultWallet(token: string): Promise<any> {
    try {
      const response = await axios.get(`${config.COPPERX_API_URL}/api/wallets/default`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching default wallet:', error);
      return null;
    }
  }
}

export const walletService = new WalletService();