'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ControlPanel } from '@/components/ControlPanel';
import { HardwarePanel } from '@/components/HardwarePanel';
import { ChainVisualization } from '@/components/ChainVisualization';
import { 
  Block, 
  Transaction, 
  PolicyWindow, 
  ChainStatus, 
  HardwareState 
} from '@/types/blockchain';
import {
  createGenesisBlock,
  createBlock,
  calculateTxRoot,
  calculateDigest,
  isValidDigest,
  verifyBlock,
  toVoltage
} from '@/lib/blockchain';
import { motion } from 'framer-motion';

export default function CryptoLabPage() {
  // State
  const [blocks, setBlocks] = useState<Block[]>([createGenesisBlock()]);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 'A', value: 0.22, enabled: false },
    { id: 'B', value: 0.33, enabled: false },
    { id: 'C', value: 0.45, enabled: false }
  ]);
  const [policy, setPolicy] = useState<PolicyWindow>({ center: 0.5, width: 0.3 });
  const [sequence, setSequence] = useState(1);
  const [status, setStatus] = useState<ChainStatus>('idle');
  const [hardwareState, setHardwareState] = useState<HardwareState>({
    connected: false,
    mockMode: false,
    lastSignalTime: null,
    console: []
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculated values
  const txRoot = calculateTxRoot(transactions);
  const headBlock = blocks[blocks.length - 1];

  // Show toast
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Handle transaction toggle
  const handleTransactionToggle = useCallback((id: 'A' | 'B' | 'C') => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === id ? { ...tx, enabled: !tx.enabled } : tx
      )
    );
  }, []);

  // Handle policy change
  const handlePolicyChange = useCallback((newPolicy: PolicyWindow) => {
    setPolicy(newPolicy);
  }, []);

  // Handle sequence change
  const handleSequenceChange = useCallback((seq: number) => {
    setSequence(Math.max(0, seq));
  }, []);

  // Handle hardware state change
  const handleHardwareStateChange = useCallback((newState: Partial<HardwareState>) => {
    setHardwareState(prev => ({ ...prev, ...newState }));
  }, []);

  // Add block with staged flow
  const handleAddBlock = useCallback(async () => {
    if (status !== 'idle') return;

    // Staged flow with delays for UX
    setStatus('compute');
    await new Promise(resolve => setTimeout(resolve, 500));

    const digest = calculateDigest(headBlock.digestV, txRoot, sequence, policy.center);
    
    setStatus('verify');
    await new Promise(resolve => setTimeout(resolve, 300));

    const valid = isValidDigest(digest, policy);
    
    if (valid) {
      setStatus('append');
      await new Promise(resolve => setTimeout(resolve, 200));

      const newBlock = createBlock(
        blocks.length + 1,
        headBlock.digestV,
        txRoot,
        sequence,
        policy.center,
        policy
      );

      setBlocks(prev => [...prev, newBlock]);
      setSequence(prev => prev + 1);
      showToast('Block added successfully');
    } else {
      showToast('Invalid configuration - block not added');
    }

    setStatus('idle');
  }, [status, headBlock.digestV, txRoot, sequence, policy, blocks.length, showToast]);

  // Verify chain
  const handleVerifyChain = useCallback(async () => {
    if (status !== 'idle') return;

    setStatus('verify');
    await new Promise(resolve => setTimeout(resolve, 800));

    setBlocks(prev => 
      prev.map(block => ({
        ...block,
        valid: verifyBlock(block, policy.center)
      }))
    );

    setStatus('idle');
    showToast('Chain verification complete');
  }, [status, policy.center, showToast]);

  // Reset to genesis
  const handleReset = useCallback(() => {
    if (status !== 'idle') return;

    setBlocks([createGenesisBlock()]);
    setTransactions(prev => 
      prev.map(tx => ({ ...tx, enabled: false }))
    );
    setSequence(1);
    setStatus('idle');
    showToast('Chain reset to genesis');
  }, [status, showToast]);

  // Tamper with block (demo feature)
  const handleTamperBlock = useCallback((blockId: number) => {
    setBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, rootV: Math.min(1, block.rootV + 0.1) }
          : block
      )
    );
    showToast(`Block #${blockId} tampered with - run Verify Chain to see effects`);
  }, [showToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20 
          }}
          className="fixed top-4 right-4 z-50 bg-white border shadow-lg rounded-lg p-3 max-w-sm backdrop-blur-sm border-blue-200"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm">{toastMessage}</span>
          </div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CryptoLab</h1>
          <p className="text-lg text-gray-600 mb-4">
            No-mining, analog blockchain implemented completely in hardware
          </p>
          
          {/* Header badges on medium+ screens */}
          <div className="hidden md:flex justify-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              Policy Center: {toVoltage(policy.center)}V
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Window: {(policy.width * 100).toFixed(1)}%
            </Badge>
          </div>
        </motion.div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ControlPanel
              transactions={transactions}
              onTransactionToggle={handleTransactionToggle}
              txRoot={txRoot}
              policy={policy}
              onPolicyChange={handlePolicyChange}
              sequence={sequence}
              onSequenceChange={handleSequenceChange}
              status={status}
              onAddBlock={handleAddBlock}
              onVerifyChain={handleVerifyChain}
              onReset={handleReset}
            />
          </motion.div>

          {/* Right Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hardware Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <HardwarePanel
                hardwareState={hardwareState}
                onHardwareStateChange={handleHardwareStateChange}
                onShowToast={showToast}
              />
            </motion.div>

            {/* Chain Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ChainVisualization
                blocks={blocks}
                onTamperBlock={handleTamperBlock}
              />
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-16 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>
            Blocks are appended deterministically (no nonce search, no mining). 
            The UI simulates the analog chain and can send pulses to the physical rig.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
