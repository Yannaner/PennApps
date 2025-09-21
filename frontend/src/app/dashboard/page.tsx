'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscribeToUserTransactions } from '@/lib/database';
import { Transaction } from '@/types';
import SendCoinsForm from '@/components/SendCoinsForm';
import TransactionHistory from '@/components/TransactionHistory';
import BlockchainEventsDisplay from '@/components/BlockchainEventsDisplay';
import BlockchainStatus from '@/components/BlockchainStatus';
import Image from 'next/image';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-200 font-medium text-lg">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="relative w-10 h-10 mr-3">
                  <Image
                    src="/cryptolab.png"
                    alt="CryptoLab Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold">
                  <span className="bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent">Crypto</span>
                  <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Lab</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-200 hover:text-amber-300 transition-colors bg-white/5 rounded-lg border border-white/10 hover:bg-white/10"
              >
                <div className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}>
                  🔄
                </div>
                Refresh
              </button>
              
              <div className="text-sm text-blue-200 font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                {user.displayName || user.email}
              </div>
              
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-blue-200 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/10 hover:bg-red-500/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-200 mb-2">Your ECO Coin Balance</h2>
            <div className="text-6xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent mb-4">
              {user.ecoCoins} ECO
            </div>
            <p className="text-blue-300">
              Digital currency verified by physical blockchain technology
            </p>
          </div>
        </div>

        {/* Send Coins Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-blue-200 mb-6">Send ECO Coins</h3>
          <SendCoinsForm 
            currentUser={user}
            onTransactionSuccess={handleRefresh}
          />
        </div>

        {/* Blockchain Events Display */}
        <div className="mb-8">
          <BlockchainEventsDisplay />
        </div>

        {/* Blockchain Status */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-blue-200 mb-6">Hardware Blockchain Status</h3>
          <BlockchainStatus />
        </div>

        {/* Transaction History */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-blue-200 mb-6">Transaction History</h3>
          <TransactionHistory 
            transactions={transactions}
            currentUserId={user.uid}
          />
        </div>
      </div>
    </div>
  );
}