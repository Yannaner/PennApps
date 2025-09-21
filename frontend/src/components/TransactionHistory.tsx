'use client';

import { Transaction } from '@/types';
import { TransactionService } from '@/lib/transactions';
import { VerificationStatus } from '@/lib/blockchain';
import { useState, useEffect } from 'react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentUserId: string;
}

export default function TransactionHistory({ transactions, currentUserId }: TransactionHistoryProps) {
  const [verificationStatuses, setVerificationStatuses] = useState<Record<string, VerificationStatus & { transactionId: string }>>({});

  useEffect(() => {
    // Update verification statuses for verifying transactions
    const verifyingTransactions = transactions.filter(t => t.status === 'verifying');
    
    if (verifyingTransactions.length > 0) {
      const interval = setInterval(() => {
        const newStatuses: Record<string, VerificationStatus & { transactionId: string }> = {};
        
        verifyingTransactions.forEach(transaction => {
          if (transaction.id) {
            const status = TransactionService.getTransactionStatus(transaction.id);
            newStatuses[transaction.id] = status;
          }
        });
        
        setVerificationStatuses(newStatuses);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [transactions]);

  const getStatusBadge = (transaction: Transaction) => {
    switch (transaction.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-400/30">
            ⏳ Pending
          </span>
        );
      case 'verifying':
        const status = transaction.id ? verificationStatuses[transaction.id] : null;
        if (status && status.isVerifying) {
          return (
            <div className="flex flex-col">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
                🔗 Verifying ({status.progress.toFixed(0)}%)
              </span>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${status.progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-blue-200 mt-1 font-medium">
                {Math.ceil(status.timeRemaining / 1000)}s remaining
              </span>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
            🔗 Blockchain Verifying
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-200 border border-green-400/30">
            ✅ Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-200 border border-red-400/30">
            ❌ Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-200 text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3>
        <p className="text-blue-200">
          Start by sending some ECO Coins to see your transaction history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const isOutgoing = transaction.fromUserId === currentUserId;
        const otherUserEmail = isOutgoing ? transaction.toUserEmail : transaction.fromUserEmail;
        
        return (
          <div
            key={transaction.id || `${transaction.fromUserId}-${transaction.createdAt.getTime()}`}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  isOutgoing 
                    ? 'bg-red-500/20 text-red-300 border border-red-400/30' 
                    : 'bg-green-500/20 text-green-300 border border-green-400/30'
                }`}>
                  {isOutgoing ? '↗️' : '↙️'}
                </div>
                <div>
                  <h4 className="font-medium text-white">
                    {isOutgoing ? 'Sent to' : 'Received from'} {otherUserEmail}
                  </h4>
                  <p className="text-sm text-blue-200">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  isOutgoing ? 'text-red-300' : 'text-green-300'
                }`}>
                  {isOutgoing ? '-' : '+'}{transaction.amount} ECO
                </div>
                {getStatusBadge(transaction)}
              </div>
            </div>

            {transaction.status === 'verifying' && (
              <div className="mt-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg backdrop-blur-sm">
                <div className="flex items-center text-sm text-blue-200">
                  <span className="animate-pulse mr-2">🔗</span>
                  <span>Physical blockchain network is verifying this transaction...</span>
                </div>
                <div className="text-xs text-blue-300 mt-1">
                  Hardware nodes are flashing and processing consensus verification
                </div>
              </div>
            )}

            {transaction.status === 'completed' && transaction.completedAt && (
              <div className="mt-2 text-xs text-blue-300">
                Completed: {formatDate(transaction.completedAt)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}