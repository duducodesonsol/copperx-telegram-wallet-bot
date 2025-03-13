// User session management types
export interface UserSession {
  userId: string;
  telegramId: number;
  token: string;
  refreshToken: string;
  organizationId: string;
  expiresAt: number;
  email?: string;
}

// Authentication types
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  organizations: Organization[];
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  role: string;
}

// KYC/KYB types
export interface KycStatus {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type: 'INDIVIDUAL' | 'BUSINESS';
  updatedAt: string;
  createdAt: string;
}

// Wallet types
export interface Wallet {
  id: string;
  network: Network;
  address: string;
  isDefault: boolean;
  createdAt: string;
}

export interface WalletBalance {
  id: string;
  network: Network;
  balance: string;
  isDefault: boolean;
}

export type Network = 'SOLANA' | 'ETHEREUM' | 'POLYGON' | 'BSC' | 'AVALANCHE';

// Transaction types
export interface Transaction {
  id: string;
  amount: string;
  fee?: string;
  type: TransactionType;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  recipient?: string;
  recipientEmail?: string;
  recipientWallet?: string;
  network?: Network;
  message?: string;
}

export type TransactionType = 
  'DEPOSIT' | 
  'WITHDRAWAL' | 
  'EMAIL_TRANSFER' | 
  'WALLET_TRANSFER' | 
  'BANK_WITHDRAWAL';

export type TransactionStatus = 
  'PENDING' | 
  'COMPLETED' | 
  'FAILED' | 
  'PROCESSING' | 
  'CANCELLED';

// API Request/Response types
export interface EmailOtpRequest {
  email: string;
}

export interface EmailOtpVerifyRequest {
  email: string;
  code: string;
}

export interface SetDefaultWalletRequest {
  walletId: string;
}

export interface EmailTransferRequest {
  email: string;
  amount: string;
  message?: string;
}

export interface WalletTransferRequest {
  walletAddress: string;
  amount: string;
  network: Network;
}

export interface BankWithdrawalRequest {
  amount: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

// Notification types
export interface PusherAuthRequest {
  socket_id: string;
  channel_name: string;
}

export interface DepositNotification {
  amount: string;
  network: Network;
  walletId: string;
  transactionId: string;
  timestamp: string;
}

// Bot state management types
export enum BotState {
  IDLE = 'IDLE',
  AWAITING_EMAIL = 'AWAITING_EMAIL',
  AWAITING_OTP = 'AWAITING_OTP',
  AWAITING_RECIPIENT_EMAIL = 'AWAITING_RECIPIENT_EMAIL',
  AWAITING_TRANSFER_AMOUNT = 'AWAITING_TRANSFER_AMOUNT',
  AWAITING_TRANSFER_MESSAGE = 'AWAITING_TRANSFER_MESSAGE',
  AWAITING_WALLET_ADDRESS = 'AWAITING_WALLET_ADDRESS',
  AWAITING_WITHDRAWAL_AMOUNT = 'AWAITING_WITHDRAWAL_AMOUNT',
  AWAITING_NETWORK_SELECTION = 'AWAITING_NETWORK_SELECTION',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION'
}

export interface BotContext {
  state: BotState;
  data: {
    recipient?: string;
    amount?: string;
    message?: string;
    network?: Network;
    walletAddress?: string;
    transactionType?: TransactionType;
  };
}

// Error types
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// Config types
export interface BotConfig {
  TELEGRAM_BOT_TOKEN: string;
  COPPERX_API_URL: string;
  PUSHER_KEY: string;
  PUSHER_CLUSTER: string;
  SESSION_TTL: number; // Time to live in seconds
}