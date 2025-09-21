'use client';

import { useState } from 'react';
import { TransactionService } from '@/lib/transactions';
import { User, TransactionRequest } from '@/types';
import { realBlockchainService } from '@/lib/realBlockchain';

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

      // Start blockchain control automatically before sending transaction
      try {
        await realBlockchainService.controlBlockchain('start');
        console.log('Blockchain started automatically');
      } catch (error) {
        console.warn('Could not start blockchain automatically:', error);
        // Continue with transaction even if blockchain start fails
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

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="toUserEmail" className="block text-sm font-medium text-white mb-2">
            Recipient Email Address
          </label>
          <input
            id="toUserEmail"
            type="email"
            value={formData.toUserEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, toUserEmail: e.target.value }))}
            className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900 placeholder-gray-500 shadow-sm"
            placeholder="Enter recipient's email"
            required
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-white mb-2">
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
              className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900 placeholder-gray-500 shadow-sm"
              placeholder="Enter amount"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-600 text-sm font-medium">ECO</span>
            </div>
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Available: {currentUser.ecoCoins} ECO Coins
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg text-sm font-medium backdrop-blur-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-400 text-green-200 px-4 py-3 rounded-lg text-sm font-medium backdrop-blur-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || formData.amount <= 0 || !formData.toUserEmail}
          className="w-full bg-transparent border-2 border-amber-400 text-amber-300 py-3 px-4 rounded-xl font-bold hover:bg-amber-400/10 hover:border-amber-300 hover:text-amber-200 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mr-2"></div>
              Sending ECO Coins...
            </div>
          ) : (
            'Send ECO Coins'
          )}
        </button>
      </form>
    </div>
  );
}