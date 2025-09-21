import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  runTransaction,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Transaction, TransactionRequest } from '@/types';

// User operations
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    console.log(`🔍 Searching for user with email: "${email}"`);
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Query returned ${querySnapshot.docs.length} documents`);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log(`✅ Found user:`, {
        uid: userDoc.id,
        email: userData.email,
        displayName: userData.displayName
      });
      
      return {
        uid: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        ecoCoins: userData.ecoCoins,
        createdAt: userData.createdAt.toDate(),
        updatedAt: userData.updatedAt.toDate(),
      };
    }
    
    console.log(`❌ No user found with email: "${email}"`);
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    // Return null instead of throwing to handle gracefully
    return null;
  }
};

export const updateUserBalance = async (userId: string, newBalance: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ecoCoins: newBalance,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user balance:', error);
    // Don't throw, just log the error
  }
};

// Transaction operations with simplified error handling
export const createTransaction = async (
  fromUserId: string,
  fromUserEmail: string,
  transactionRequest: TransactionRequest
): Promise<string> => {
  try {
    console.log(`💰 Creating transaction from ${fromUserEmail} to ${transactionRequest.toUserEmail}`);
    
    // First, find the recipient by email
    const recipientUser = await getUserByEmail(transactionRequest.toUserEmail);
    
    if (!recipientUser) {
      console.error(`❌ Recipient not found: ${transactionRequest.toUserEmail}`);
      throw new Error(`Recipient user not found. Please check the email address: ${transactionRequest.toUserEmail}`);
    }

    console.log(`✅ Found recipient: ${recipientUser.displayName} (${recipientUser.email})`);

    if (recipientUser.uid === fromUserId) {
      throw new Error('Cannot send coins to yourself');
    }

    // Create transaction document
    const transaction: Omit<Transaction, 'id'> = {
      fromUserId,
      fromUserEmail,
      toUserId: recipientUser.uid,
      toUserEmail: transactionRequest.toUserEmail,
      amount: transactionRequest.amount,
      status: 'pending',
      createdAt: new Date(),
    };

    const transactionRef = await addDoc(collection(db, 'transactions'), transaction);
    console.log(`✅ Transaction created with ID: ${transactionRef.id}`);
    return transactionRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const processTransaction = async (transactionId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await transaction.get(transactionRef);
      
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }
      
      const transactionData = transactionDoc.data() as Transaction;
      
      if (transactionData.status !== 'pending') {
        throw new Error('Transaction is not pending');
      }
      
      // Get sender and recipient balances
      const senderRef = doc(db, 'users', transactionData.fromUserId);
      const recipientRef = doc(db, 'users', transactionData.toUserId);
      
      const senderDoc = await transaction.get(senderRef);
      const recipientDoc = await transaction.get(recipientRef);
      
      if (!senderDoc.exists() || !recipientDoc.exists()) {
        throw new Error('User not found');
      }
      
      const senderData = senderDoc.data();
      const recipientData = recipientDoc.data();
      
      if (senderData.ecoCoins < transactionData.amount) {
        // Update transaction status to failed
        transaction.update(transactionRef, {
          status: 'failed',
          completedAt: new Date()
        });
        throw new Error('Insufficient balance');
      }
      
      // Update balances
      const newSenderBalance = senderData.ecoCoins - transactionData.amount;
      const newRecipientBalance = recipientData.ecoCoins + transactionData.amount;
      
      transaction.update(senderRef, {
        ecoCoins: newSenderBalance,
        updatedAt: new Date()
      });
      
      transaction.update(recipientRef, {
        ecoCoins: newRecipientBalance,
        updatedAt: new Date()
      });
      
      // Update transaction status to verifying
      transaction.update(transactionRef, {
        status: 'verifying',
        blockchainVerificationStarted: new Date()
      });
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    throw error;
  }
};

export const completeTransaction = async (transactionId: string): Promise<void> => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    await updateDoc(transactionRef, {
      status: 'completed',
      completedAt: new Date()
    });
  } catch (error) {
    console.error('Error completing transaction:', error);
    // Don't throw, just log the error
  }
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    console.log(`🔍 Loading transactions for user: ${userId}`);
    
    const transactionsRef = collection(db, 'transactions');
    
    // Query for sent transactions (without orderBy to avoid index requirement)
    const q1 = query(
      transactionsRef, 
      where('fromUserId', '==', userId)
    );
    
    // Query for received transactions
    const q2 = query(
      transactionsRef, 
      where('toUserId', '==', userId)
    );
    
    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    const transactions: Transaction[] = [];
    
    sentSnapshot.docs.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        fromUserId: data.fromUserId,
        fromUserEmail: data.fromUserEmail,
        toUserId: data.toUserId,
        toUserEmail: data.toUserEmail,
        amount: data.amount,
        status: data.status,
        createdAt: data.createdAt.toDate(),
        completedAt: data.completedAt?.toDate(),
        blockchainVerificationStarted: data.blockchainVerificationStarted?.toDate(),
      });
    });
    
    receivedSnapshot.docs.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        fromUserId: data.fromUserId,
        fromUserEmail: data.fromUserEmail,
        toUserId: data.toUserId,
        toUserEmail: data.toUserEmail,
        amount: data.amount,
        status: data.status,
        createdAt: data.createdAt.toDate(),
        completedAt: data.completedAt?.toDate(),
        blockchainVerificationStarted: data.blockchainVerificationStarted?.toDate(),
      });
    });
    
    // Sort by creation date (most recent first)
    const sortedTransactions = transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log(`✅ Found ${sortedTransactions.length} transactions for user`);
    return sortedTransactions;
  } catch (error) {
    console.error('Error getting user transactions:', error);
    // Return empty array instead of throwing
    return [];
  }
};

// Simplified real-time listeners with error handling
export const subscribeToUserTransactions = (
  userId: string, 
  callback: (transactions: Transaction[]) => void
) => {
  try {
    console.log(`🔔 Setting up real-time listener for user: ${userId}`);
    
    const transactionsRef = collection(db, 'transactions');
    
    // Remove orderBy to avoid index requirements
    const q1 = query(
      transactionsRef, 
      where('fromUserId', '==', userId)
    );
    const q2 = query(
      transactionsRef, 
      where('toUserId', '==', userId)
    );
    
    let sentTransactions: Transaction[] = [];
    let receivedTransactions: Transaction[] = [];
    
    const updateCallback = () => {
      const allTransactions = [...sentTransactions, ...receivedTransactions]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      console.log(`📊 Updated transactions: ${allTransactions.length} total`);
      callback(allTransactions);
    };
    
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      sentTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fromUserId: data.fromUserId,
          fromUserEmail: data.fromUserEmail,
          toUserId: data.toUserId,
          toUserEmail: data.toUserEmail,
          amount: data.amount,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          blockchainVerificationStarted: data.blockchainVerificationStarted?.toDate(),
        };
      });
      updateCallback();
    }, (error) => {
      console.error('Error listening to sent transactions:', error);
      // Continue with empty array
      sentTransactions = [];
      updateCallback();
    });
    
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      receivedTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fromUserId: data.fromUserId,
          fromUserEmail: data.fromUserEmail,
          toUserId: data.toUserId,
          toUserEmail: data.toUserEmail,
          amount: data.amount,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          blockchainVerificationStarted: data.blockchainVerificationStarted?.toDate(),
        };
      });
      updateCallback();
    }, (error) => {
      console.error('Error listening to received transactions:', error);
      // Continue with empty array
      receivedTransactions = [];
      updateCallback();
    });
    
    // Return combined unsubscribe function
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  } catch (error) {
    console.error('Error setting up transaction listener:', error);
    // Return no-op unsubscribe function
    return () => {};
  }
};