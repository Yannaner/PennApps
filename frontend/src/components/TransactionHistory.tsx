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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⏳ Pending
          </span>
        );
      case 'verifying':
        const status = transaction.id ? verificationStatuses[transaction.id] : null;
        if (status && status.isVerifying) {
          return (
            <div className="flex flex-col">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🔗 Verifying ({status.progress.toFixed(0)}%)
              </span>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${status.progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-700 mt-1 font-medium">
                {Math.ceil(status.timeRemaining / 1000)}s remaining
              </span>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            🔗 Blockchain Verifying
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-600 text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
        <p className="text-gray-800">
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
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  isOutgoing 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {isOutgoing ? '↗️' : '↙️'}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {isOutgoing ? 'Sent to' : 'Received from'} {otherUserEmail}
                  </h4>
                  <p className="text-sm text-gray-800">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  isOutgoing ? 'text-red-600' : 'text-green-600'
                }`}>
                  {isOutgoing ? '-' : '+'}{transaction.amount} ECO
                </div>
                {getStatusBadge(transaction)}
              </div>
            </div>

            {transaction.status === 'verifying' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-sm text-blue-700">
                  <span className="animate-pulse mr-2">🔗</span>
                  <span>Physical blockchain network is verifying this transaction...</span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Hardware nodes are flashing and processing consensus verification
                </div>
              </div>
            )}

            {transaction.status === 'completed' && transaction.completedAt && (
              <div className="mt-2 text-xs text-gray-500">
                Completed: {formatDate(transaction.completedAt)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}