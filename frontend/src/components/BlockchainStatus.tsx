'use client';

import { useState, useEffect } from 'react';
import { realBlockchainService, BlockchainState } from '@/lib/realBlockchain';

export default function BlockchainStatus() {
  const [blockchainState, setBlockchainState] = useState<BlockchainState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const state = await realBlockchainService.getState();
        setBlockchainState(state);
      } catch (error) {
        console.error('Failed to fetch initial blockchain state:', error);
      }
    };

    fetchInitialState();
    setIsConnected(realBlockchainService.isConnected());

    const handleStateUpdate = (event: any) => {
      if (event.type === 'state') {
        setBlockchainState({
          round: event.round || 0,
          leader: event.leader || 0,
          blockHeight: event.blockHeight || 0,
          balances: event.balances || {},
          mempool: event.mempool || [],
          ports: event.ports || [],
          threshold: event.threshold || 0.6
        });
      }
    };

    const handleConnectionUpdate = () => {
      setIsConnected(realBlockchainService.isConnected());
    };

    realBlockchainService.addEventListener('state', handleStateUpdate);
    realBlockchainService.addEventListener('connection', handleConnectionUpdate);

    const connectionInterval = setInterval(handleConnectionUpdate, 2000);

    return () => {
      realBlockchainService.removeEventListener('state', handleStateUpdate);
      realBlockchainService.removeEventListener('connection', handleConnectionUpdate);
      clearInterval(connectionInterval);
    };
  }, []);

  const handleControlAction = async (action: 'start' | 'stop' | 'reset') => {
    try {
      await realBlockchainService.controlBlockchain(action);
      console.log(`Blockchain ${action} command sent`);
    } catch (error) {
      console.error(`Failed to ${action} blockchain:`, error);
    }
  };

  if (!blockchainState) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{isConnected ? '🟢' : '🔴'}</span>
          <div>
            <h4 className="font-medium text-gray-900">Network Status</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isConnected ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            }`}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Block Height</div>
          <div className="text-lg font-bold text-gray-900">
            {blockchainState.blockHeight}
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">Blockchain Controls</h4>
        <div className="flex space-x-2">
          <button
            onClick={() => handleControlAction('start')}
            className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
          >
            Start
          </button>
          <button
            onClick={() => handleControlAction('stop')}
            className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
          >
            Stop
          </button>
          <button
            onClick={() => handleControlAction('reset')}
            className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Current Round</div>
          <div className="text-xl font-bold text-gray-900">{blockchainState.round}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Current Leader</div>
          <div className="text-xl font-bold text-gray-900">Node {blockchainState.leader}</div>
        </div>
      </div>

      {blockchainState.mempool.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="animate-pulse mr-2">⏳</span>
            <h4 className="font-medium text-amber-900">Pending Transactions</h4>
          </div>
          <p className="text-sm text-amber-700 mb-2">
            {blockchainState.mempool.length} transaction{blockchainState.mempool.length !== 1 ? 's' : ''} waiting for consensus.
          </p>
          <div className="space-y-1">
            {blockchainState.mempool.slice(0, 3).map((tx, index) => (
              <div key={index} className="text-xs text-amber-800 bg-amber-100 p-2 rounded">
                {tx.from_addr || 'System'} → {tx.to}: {tx.amt} ECO
              </div>
            ))}
            {blockchainState.mempool.length > 3 && (
              <div className="text-xs text-amber-700">
                +{blockchainState.mempool.length - 3} more transactions...
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Blockchain Balances</h4>
        <div className="space-y-2">
          {Object.entries(blockchainState.balances).map(([address, balance]) => (
            <div key={address} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{address}</span>
              <span className="font-medium text-gray-900">{balance} ECO</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}