export interface User {
  uid: string;
  email: string;
  displayName?: string;
  ecoCoins: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id?: string;
  fromUserId: string;
  fromUserEmail: string;
  toUserId: string;
  toUserEmail: string;
  amount: number;
  status: 'pending' | 'verifying' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  blockchainVerificationStarted?: Date;
}

export interface TransactionRequest {
  toUserEmail: string;
  amount: number;
}