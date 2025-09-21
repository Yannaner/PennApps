'use client';

import { useState, useEffect } from 'react';
import { TransactionService } from '@/lib/transactions';
import { NetworkStatus } from '@/lib/blockchain';

export default function BlockchainStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [activeVerifications, setActiveVerifications] = useState<string[]>([]);

  useEffect(() => {
    // Update network status and active verifications
    const updateStatus = () => {
      const status = TransactionService.getNetworkStatus();
      const verifications = TransactionService.getActiveVerifications();
      
      setNetworkStatus(status);
      setActiveVerifications(verifications);
    };

    // Initial update
    updateStatus();

    // Update every 2 seconds
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'poor':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
        return '🟢';
      case 'good':
        return '🔵';
      case 'poor':
        return '🟡';
      case 'offline':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (!networkStatus) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Health */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{getHealthIcon(networkStatus.networkHealth)}</span>
          <div>
            <h4 className="font-medium text-gray-900">Network Status</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(networkStatus.networkHealth)}`}>
              {networkStatus.networkHealth.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Nodes Online</div>
          <div className="text-lg font-bold text-gray-900">
            {networkStatus.nodesOnline}/{networkStatus.totalNodes}
          </div>
        </div>
      </div>

      {/* Physical Nodes Visualization */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Physical Blockchain Nodes</h4>
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: networkStatus.totalNodes }, (_, i) => {
            const isOnline = i < networkStatus.nodesOnline;
            const isActive = activeVerifications.length > 0 && isOnline;
            
            return (
              <div
                key={i}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-500 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse shadow-lg' 
                    : isOnline
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {activeVerifications.length > 0 
            ? `${activeVerifications.length} transaction(s) being verified - nodes are flashing!`
            : 'Nodes ready for transaction verification'
          }
        </p>
      </div>

      {/* Active Verifications */}
      {activeVerifications.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="animate-spin mr-2">⚡</span>
            <h4 className="font-medium text-blue-900">Active Blockchain Verifications</h4>
          </div>
          <p className="text-sm text-blue-700">
            {activeVerifications.length} transaction{activeVerifications.length !== 1 ? 's' : ''} currently being verified by the physical blockchain network.
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {activeVerifications.map((transactionId, index) => (
              <span
                key={transactionId}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                TX#{index + 1}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Network Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-900">Last Heartbeat</div>
          <div className="text-gray-600">
            {networkStatus.lastHeartbeat.toLocaleTimeString()}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-900">Verification Time</div>
          <div className="text-gray-600">Variable</div>
        </div>
      </div>

      {/* Hardware Description */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">🔧 Physical Blockchain Hardware</h4>
        <p className="text-sm text-purple-700">
          Our unique physical blockchain consists of {networkStatus.totalNodes} hardware nodes with LED indicators. 
          When you send ECO Coins, the nodes light up and flash in sequence to visualize the 
          consensus verification process in real-time!
        </p>
      </div>
    </div>
  );
}