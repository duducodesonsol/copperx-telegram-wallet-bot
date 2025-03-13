import { UserSession } from '../types';

// In-memory session storage (could be replaced with Redis or similar in production)
const sessions: Map<number, UserSession> = new Map();

export const sessionManager = {
  saveSession(telegramId: number, session: UserSession): void {
    session.telegramId = telegramId;
    sessions.set(telegramId, session);
  },

  getSession(telegramId: number): UserSession | undefined {
    return sessions.get(telegramId);
  },

  removeSession(telegramId: number): void {
    sessions.delete(telegramId);
  },

  isAuthenticated(telegramId: number): boolean {
    const session = this.getSession(telegramId);
    if (!session) return false;
    return session.expiresAt > Date.now();
  },
};