'use client';

import { useState, useEffect } from 'react';
import { realBlockchainService, BlockchainEvent } from '@/lib/realBlockchain';

interface EventLogEntry {
  id: string;
  timestamp: Date;
  type: string;
  description: string;
  details: any;
  color: string;
  icon: string;
}

export default function BlockchainEventsDisplay() {
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [maxEvents] = useState(50); // Keep last 50 events

  useEffect(() => {
    // Check initial connection status
    setIsConnected(realBlockchainService.isConnected());

    // Event handler for blockchain events
    const handleBlockchainEvent = (event: BlockchainEvent) => {
      const eventEntry = createEventLogEntry(event);
      if (eventEntry) {
        setEvents(prev => {
          const newEvents = [eventEntry, ...prev];
          return newEvents.slice(0, maxEvents); // Keep only last N events
        });
      }
    };

    // Connection status handler
    const handleConnectionEvent = (event: BlockchainEvent) => {
      setIsConnected(realBlockchainService.isConnected());
    };

    // Add event listeners
    realBlockchainService.addEventListener('all', handleBlockchainEvent);
    realBlockchainService.addEventListener('connection', handleConnectionEvent);

    return () => {
      realBlockchainService.removeEventListener('all', handleBlockchainEvent);
      realBlockchainService.removeEventListener('connection', handleConnectionEvent);
    };
  }, [maxEvents]);

  const createEventLogEntry = (event: BlockchainEvent): EventLogEntry | null => {
    const timestamp = new Date();
    const id = `${timestamp.getTime()}-${Math.random()}`;

    switch (event.type) {
      case 'state':
        return {
          id,
          timestamp,
          type: 'State Update',
          description: `Round ${event.round}, Block ${event.blockHeight}, Leader: Node ${event.leader}`,
          details: event,
          color: 'bg-blue-500/20 text-blue-200 border-blue-400',
          icon: '📊'
        };

      case 'chal':
        return {
          id,
          timestamp,
          type: 'Challenge',
          description: `Round ${event.round} challenge sent to nodes (Leader: Node ${event.leader})`,
          details: { seed: event.seed, duration: event.durMs },
          color: 'bg-amber-500/20 text-amber-200 border-amber-400',
          icon: '⚡'
        };

      case 'witness':
        return {
          id,
          timestamp,
          type: 'Witness',
          description: `Node ${event.node} provided witness with correlation ${(event.corr || 0).toFixed(3)}`,
          details: event,
          color: 'bg-green-500/20 text-green-200 border-green-400',
          icon: '👁️'
        };

      case 'commit':
        return {
          id,
          timestamp,
          type: 'Block Committed',
          description: `Block ${event.round} committed by Node ${event.leader} with ${event.includedTx?.length || 0} transactions`,
          details: { 
            transactions: event.includedTx,
            balances: event.balances
          },
          color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400',
          icon: '✅'
        };

      case 'skip':
        return {
          id,
          timestamp,
          type: 'Block Skipped',
          description: `Round ${event.round} skipped - no valid witness received`,
          details: event,
          color: 'bg-red-500/20 text-red-200 border-red-400',
          icon: '⏭️'
        };

      default:
        return null;
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-blue-200">
          Blockchain Events {isConnected ? '🟢' : '🔴'}
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-blue-300">
            {isConnected ? 'Connected to Hardware' : 'Disconnected'}
          </div>
          <button
            onClick={clearEvents}
            className="px-3 py-1 text-xs font-medium text-blue-200 hover:text-red-300 transition-colors bg-white/5 rounded border border-white/10 hover:bg-red-500/10"
          >
            Clear Events
          </button>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg text-sm font-medium backdrop-blur-sm mb-4">
          ⚠️ Not connected to blockchain backend. Make sure the bridge.py server is running on port 8787.
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center text-blue-300 py-8">
            <div className="text-4xl mb-2">⏳</div>
            <p>No blockchain events yet...</p>
            <p className="text-sm text-blue-400 mt-1">
              Events will appear here when the blockchain is active
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-lg border backdrop-blur-sm ${event.color}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-xl">{event.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">
                      {event.type}
                    </div>
                    <div className="text-sm opacity-90">
                      {event.description}
                    </div>
                    {event.type === 'Block Committed' && event.details.transactions && event.details.transactions.length > 0 && (
                      <div className="mt-2 text-xs opacity-75">
                        <div className="font-medium">Transactions:</div>
                        {event.details.transactions.map((tx: any, idx: number) => (
                          <div key={idx} className="ml-2">
                            {tx.from || 'System'} → {tx.to}: {tx.amt} ECO
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs opacity-75 font-mono">
                  {formatTime(event.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {events.length > 0 && (
        <div className="mt-4 text-xs text-blue-400 text-center">
          Showing last {events.length} events (max {maxEvents})
        </div>
      )}
    </div>
  );
}