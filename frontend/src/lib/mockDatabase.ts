import { User, Transaction } from '@/types';

// Simple in-memory database for demo purposes
class MockDatabase {
  private users: Map<string, User> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private currentUserId: string | null = null;

  // User operations
  createUser(email: string, password: string, displayName?: string): User {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const user: User = {
      uid: userId,
      email,
      displayName: displayName || email.split('@')[0],
      ecoCoins: 100, // Default 100 ECO coins
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(userId, user);
    return user;
  }

  authenticateUser(email: string, password: string): User | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        this.currentUserId = user.uid;
        return user;
      }
    }
    return null;
  }

  getCurrentUser(): User | null {
    if (this.currentUserId) {
      return this.users.get(this.currentUserId) || null;
    }
    return null;
  }

  getUserByEmail(email: string): User | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  updateUserBalance(userId: string, newBalance: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.ecoCoins = newBalance;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  logout(): void {
    this.currentUserId = null;
  }

  // Transaction operations
  createTransaction(fromUserId: string, fromUserEmail: string, toUserEmail: string, amount: number): string {
    const recipient = this.getUserByEmail(toUserEmail);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const sender = this.users.get(fromUserId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    if (sender.ecoCoins < amount) {
      throw new Error('Insufficient balance');
    }

    const transactionId = 'tx_' + Math.random().toString(36).substr(2, 9);
    const transaction: Transaction = {
      id: transactionId,
      fromUserId,
      fromUserEmail,
      toUserId: recipient.uid,
      toUserEmail,
      amount,
      status: 'pending',
      createdAt: new Date()
    };

    this.transactions.set(transactionId, transaction);

    // Process transaction immediately in demo
    this.processTransaction(transactionId);

    return transactionId;
  }

  private processTransaction(transactionId: string): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    const sender = this.users.get(transaction.fromUserId);
    const recipient = this.users.get(transaction.toUserId);

    if (sender && recipient) {
      // Update balances
      sender.ecoCoins -= transaction.amount;
      recipient.ecoCoins += transaction.amount;
      sender.updatedAt = new Date();
      recipient.updatedAt = new Date();

      // Update transaction status
      transaction.status = 'verifying';
      transaction.blockchainVerificationStarted = new Date();

      // Simulate blockchain verification after 30 seconds
      setTimeout(() => {
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        this.transactions.set(transactionId, transaction);
      }, 30000);
    }
  }

  getUserTransactions(userId: string): Transaction[] {
    const userTransactions: Transaction[] = [];
    
    for (const transaction of this.transactions.values()) {
      if (transaction.fromUserId === userId || transaction.toUserId === userId) {
        userTransactions.push(transaction);
      }
    }

    return userTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTransaction(transactionId: string): Transaction | null {
    return this.transactions.get(transactionId) || null;
  }

  // Seed some demo users
  seedDemoData(): void {
    this.createUser('alice@example.com', 'password', 'Alice');
    this.createUser('bob@example.com', 'password', 'Bob');
    this.createUser('charlie@example.com', 'password', 'Charlie');
  }
}

export const mockDB = new MockDatabase();
// Seed demo data
mockDB.seedDemoData();