'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscribeToUserTransactions } from '@/lib/database';
import { Transaction } from '@/types';
import { TransactionService } from '@/lib/transactions';
import SendCoinsForm from '@/components/SendCoinsForm';
import TransactionHistory from '@/components/TransactionHistory';
import BlockchainStatus from '@/components/BlockchainStatus';

export default function Dashboard() {
  const { user, loading, signOut, refreshUserData } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Set up real-time transaction listener
      const unsubscribe = subscribeToUserTransactions(user.uid, (newTransactions) => {
        setTransactions(newTransactions);
      });

      return unsubscribe;
    }
  }, [user, loading, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-600 font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg font-bold">₿</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">CryptoLab</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <div className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}>
                  🔄
                </div>
                Refresh
              </button>
              
              <div className="text-sm text-gray-600">
                {user.displayName || user.email}
              </div>
              
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your ECO Coin Balance</h2>
            <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              {user.ecoCoins} ECO
            </div>
            <p className="text-gray-600">
              Digital currency verified by physical blockchain technology
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Send Coins Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Send ECO Coins</h3>
            <SendCoinsForm 
              currentUser={user}
              onTransactionSuccess={handleRefresh}
            />
          </div>

          {/* Blockchain Status */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Blockchain Network</h3>
            <BlockchainStatus />
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h3>
          <TransactionHistory 
            transactions={transactions}
            currentUserId={user.uid}
          />
        </div>
      </div>
    </div>
  );
}