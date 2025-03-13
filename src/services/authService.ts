import axios from 'axios';
import { config } from '../config';
import { UserSession } from '../types';
import { KycStatus } from '../types';


class AuthService {
  async requestEmailOtp(email: string): Promise<boolean> {
    try {
      await axios.post(`${config.COPPERX_API_URL}/api/auth/email-otp/request`, {
        email,
      });
      return true;
    } catch (error) {
      console.error('Error requesting OTP:', error);
      return false;
    }
  }

  async verifyEmailOtp(email: string, otp: string): Promise<UserSession | null> {
    try {
      const response = await axios.post(`${config.COPPERX_API_URL}/api/auth/email-otp/authenticate`, {
        email,
        code: otp,
      });
      
      const { token, refreshToken, user } = response.data;
      
      return {
        userId: user.id,
        telegramId: 0, // Will be set later
        token,
        refreshToken,
        organizationId: user.organizations[0]?.id || '',
        expiresAt: Date.now() + 3600 * 1000, // 1 hour expiry
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return null;
    }
  }

  async getUserProfile(token: string) {
    try {
      const response = await axios.get(`${config.COPPERX_API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async getKycStatus(token: string): Promise<KycStatus | null> {
    try {
      const response = await axios.get(`${config.COPPERX_API_URL}/api/kycs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      return null;
    }
  }
}

export const authService = new AuthService();