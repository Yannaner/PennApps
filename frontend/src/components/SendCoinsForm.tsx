'use client';

import { useState } from 'react';
import { TransactionService } from '@/lib/transactions';
import { User, TransactionRequest } from '@/types';

interface SendCoinsFormProps {
  currentUser: User;
  onTransactionSuccess: () => void;
}

export default function SendCoinsForm({ currentUser, onTransactionSuccess }: SendCoinsFormProps) {
  const [formData, setFormData] = useState<TransactionRequest>({
    toUserEmail: '',
    amount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      const validation = TransactionService.validateTransactionRequest(formData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      // Check if user has sufficient balance
      if (formData.amount > currentUser.ecoCoins) {
        setError('Insufficient balance. You cannot send more ECO Coins than you have.');
        setLoading(false);
        return;
      }

      // Send transaction
      const result = await TransactionService.sendEcoCoins(
        currentUser.uid,
        currentUser.email,
        formData
      );

      setSuccess(result.message);
      setFormData({ toUserEmail: '', amount: 0 });
      
      // Refresh user data after a short delay
      setTimeout(() => {
        onTransactionSuccess();
      }, 1000);

    } catch (error: any) {
      setError(error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="toUserEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Email Address
          </label>
          <input
            id="toUserEmail"
            type="email"
            value={formData.toUserEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, toUserEmail: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Enter recipient's email"
            required
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ECO Coins)
          </label>
          <div className="relative">
            <input
              id="amount"
              type="number"
              min="1"
              max={Math.min(currentUser.ecoCoins, 1000)}
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter amount"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">ECO</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {currentUser.ecoCoins} ECO Coins
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || formData.amount <= 0 || !formData.toUserEmail}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Sending ECO Coins...
            </div>
          ) : (
            'Send ECO Coins'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">🔗 Blockchain Verification Process</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your transaction will be processed immediately</li>
          <li>• Physical blockchain hardware will verify the transaction</li>
          <li>• Verification takes 30 seconds with flashing lights</li>
          <li>• Transaction completes once blockchain consensus is reached</li>
        </ul>
      </div>
    </div>
  );
}