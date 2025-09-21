import { createTransaction, processTransaction, getUserByEmail, completeTransaction } from './database';
import { realBlockchainService } from './realBlockchain';
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

      // Step 3: Send transaction to the real blockchain backend
      try {
        const fromAddress = realBlockchainService.getBlockchainAddress(fromUserEmail);
        const toAddress = realBlockchainService.getBlockchainAddress(transactionRequest.toUserEmail);
        
        await realBlockchainService.sendTransaction(
          fromAddress,
          toAddress,
          transactionRequest.amount
        );

        console.log(`Transaction ${transactionId} sent to blockchain backend`);
        
        // Complete the transaction immediately since blockchain handles verification
        // In a more sophisticated setup, you might wait for blockchain confirmation
        setTimeout(async () => {
          try {
            await completeTransaction(transactionId);
            console.log(`Transaction ${transactionId} completed successfully`);
          } catch (error: any) {
            console.error(`Transaction ${transactionId} completion failed:`, error);
          }
        }, 1000);

      } catch (error: any) {
        console.error(`Failed to send transaction ${transactionId} to blockchain:`, error);
        throw new Error('Failed to send transaction to blockchain network');
      }

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
    // For the real blockchain, we can check if the transaction is in mempool
    const currentState = realBlockchainService.getCurrentState();
    
    return {
      transactionId,
      isVerifying: currentState ? currentState.mempool.length > 0 : false,
      blockHeight: currentState?.blockHeight || 0,
      networkConnected: realBlockchainService.isConnected()
    };
  }

  /**
   * Gets the status of the hardware blockchain network
   */
  public static getNetworkStatus() {
    const currentState = realBlockchainService.getCurrentState();
    
    return {
      isConnected: realBlockchainService.isConnected(),
      blockHeight: currentState?.blockHeight || 0,
      round: currentState?.round || 0,
      leader: currentState?.leader || 0,
      mempoolSize: currentState?.mempool.length || 0,
      threshold: currentState?.threshold || 0.6
    };
  }

  /**
   * Gets all transactions in mempool
   */
  public static getActiveVerifications() {
    const currentState = realBlockchainService.getCurrentState();
    return currentState?.mempool || [];
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