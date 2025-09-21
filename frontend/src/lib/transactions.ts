import { createTransaction, processTransaction, getUserByEmail } from './database';
import { blockchainVerificationService } from './blockchain';
import { TransactionRequest } from '@/types';

export class TransactionService {
  /**
   * Initiates a complete transaction flow with blockchain verification
   */
  public static async sendEcoCoins(
    fromUserId: string,
    fromUserEmail: string,
    transactionRequest: TransactionRequest
  ): Promise<{
    transactionId: string;
    message: string;
  }> {
    try {
      // Validate transaction amount
      if (transactionRequest.amount <= 0) {
        throw new Error('Transaction amount must be greater than 0');
      }

      if (transactionRequest.amount > 1000) {
        throw new Error('Transaction amount cannot exceed 1000 ECO Coins');
      }

      // Validate recipient email
      if (!transactionRequest.toUserEmail || !transactionRequest.toUserEmail.includes('@')) {
        throw new Error('Please provide a valid recipient email address');
      }

      // Check if recipient exists
      const recipient = await getUserByEmail(transactionRequest.toUserEmail);
      if (!recipient) {
        throw new Error('Recipient user not found. Please check the email address.');
      }

      if (recipient.uid === fromUserId) {
        throw new Error('You cannot send ECO Coins to yourself');
      }

      // Step 1: Create transaction record
      const transactionId = await createTransaction(
        fromUserId,
        fromUserEmail,
        transactionRequest
      );

      // Step 2: Process transaction (deduct from sender, add to recipient, set to verifying)
      await processTransaction(transactionId);

      // Step 3: Initiate blockchain verification with hardware signal
      // This runs asynchronously and will complete the transaction after verification
      blockchainVerificationService.initiateVerification(transactionId)
        .then(() => {
          console.log(`Transaction ${transactionId} completed successfully after blockchain verification`);
        })
        .catch((error) => {
          console.error(`Transaction ${transactionId} verification failed:`, error);
        });

      return {
        transactionId,
        message: `Transaction initiated! Your ${transactionRequest.amount} ECO Coins have been sent to ${transactionRequest.toUserEmail}. The transaction is now being verified by our physical blockchain network.`
      };

    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Gets the status of a transaction including blockchain verification progress
   */
  public static getTransactionStatus(transactionId: string) {
    const verificationStatus = blockchainVerificationService.getVerificationStatus(transactionId);
    return {
      ...verificationStatus,
      transactionId
    };
  }

  /**
   * Gets the status of the hardware blockchain network
   */
  public static getNetworkStatus() {
    return blockchainVerificationService.getHardwareNetworkStatus();
  }

  /**
   * Gets all active verifications
   */
  public static getActiveVerifications() {
    return blockchainVerificationService.getActiveVerifications();
  }

  /**
   * Validates transaction request before processing
   */
  public static validateTransactionRequest(request: TransactionRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.toUserEmail) {
      errors.push('Recipient email is required');
    } else if (!request.toUserEmail.includes('@')) {
      errors.push('Invalid email format');
    }

    if (!request.amount) {
      errors.push('Amount is required');
    } else if (request.amount <= 0) {
      errors.push('Amount must be greater than 0');
    } else if (request.amount > 1000) {
      errors.push('Amount cannot exceed 1000 ECO Coins');
    } else if (!Number.isInteger(request.amount)) {
      errors.push('Amount must be a whole number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}