'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useRouter } from 'next/navigation';
import { mockDB } from '@/lib/mockDatabase';
import { Transaction } from '@/types';

export default function Dashboard() {
  const { user, loading, signOut, refreshUserData } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Load transactions
      const userTransactions = mockDB.getUserTransactions(user.uid);
      setTransactions(userTransactions);
    }
  }, [user, loading, router]);

  const handleSendCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSendLoading(true);
    setSendError('');
    setSendSuccess('');

    try {
      const amount = parseInt(sendAmount);
      
      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (amount > user.ecoCoins) {
        throw new Error('Insufficient balance');
      }

      if (!recipientEmail) {
        throw new Error('Please enter recipient email');
      }

      // Create transaction
      const transactionId = mockDB.createTransaction(
        user.uid,
        user.email,
        recipientEmail,
        amount
      );

      setSendSuccess(`Successfully sent ${amount} ECO Coins to ${recipientEmail}! Transaction will be verified by blockchain in 30 seconds.`);
      setSendAmount('');
      setRecipientEmail('');

      // Refresh user data and transactions
      refreshUserData();
      const updatedTransactions = mockDB.getUserTransactions(user.uid);
      setTransactions(updatedTransactions);

    } catch (error: any) {
      setSendError(error.message);
    } finally {
      setSendLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'verifying':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-lg font-bold">₿</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">CryptoLab</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user.displayName || user.email}!</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Balance Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Your ECO Coin Balance</h2>
          <div className="text-5xl font-bold mb-4">{user.ecoCoins}</div>
          <p className="text-blue-100">ECO Coins verified by physical blockchain</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Send Coins */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Send ECO Coins</h3>
            
            <form onSubmit={handleSendCoins} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter recipient's email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (ECO Coins)
                </label>
                <input
                  type="number"
                  min="1"
                  max={user.ecoCoins}
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Available: {user.ecoCoins} ECO Coins</p>
              </div>

              {sendError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {sendSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={sendLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {sendLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send ECO Coins'
                )}
              </button>
            </form>

            {/* Demo Users Helper */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Try sending to:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• alice@example.com</div>
                <div>• bob@example.com</div>
                <div>• charlie@example.com</div>
              </div>
            </div>
          </div>

          {/* Blockchain Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Blockchain Network</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🟢</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Network Status</h4>
                    <span className="text-sm text-green-600 font-medium">ONLINE</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Nodes Active</div>
                  <div className="text-lg font-bold text-gray-900">8/8</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Physical Hardware Nodes</h4>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((node) => (
                    <div
                      key={node}
                      className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    >
                      {node}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  All nodes ready for transaction verification
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">🔧 How It Works</h4>
                <p className="text-sm text-purple-700">
                  When you send ECO Coins, our physical blockchain nodes light up and verify 
                  your transaction in real-time. Each transaction takes 30 seconds to complete!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Transaction History</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📋</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h4>
              <p className="text-gray-600">Send some ECO Coins to see your transaction history here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isOutgoing = transaction.fromUserId === user.uid;
                const otherUserEmail = isOutgoing ? transaction.toUserEmail : transaction.fromUserEmail;
                
                return (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          isOutgoing ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {isOutgoing ? '↗️' : '↙️'}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {isOutgoing ? 'Sent to' : 'Received from'} {otherUserEmail}
                          </h4>
                          <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          isOutgoing ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {isOutgoing ? '-' : '+'}{transaction.amount} ECO
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status === 'verifying' ? '🔗 Verifying' : transaction.status}
                        </span>
                      </div>
                    </div>

                    {transaction.status === 'verifying' && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center text-sm text-blue-700">
                          <span className="animate-pulse mr-2">🔗</span>
                          <span>Physical blockchain nodes are verifying this transaction...</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}