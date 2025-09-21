'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ControlPanel } from '@/components/ControlPanel';
import { HardwarePanel } from '@/components/HardwarePanel';
import { ChainVisualization } from '@/components/ChainVisualization';
import { CircuitBoardVisualization } from '@/components/CircuitBoardVisualization';
import { Oscilloscope } from '@/components/Oscilloscope';
import { AnalogMeter } from '@/components/AnalogMeter';
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
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Control Panel */}
          <motion.div
            className="xl:col-span-1"
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

          {/* Center Panel - Circuit Visualization */}
          <motion.div
            className="xl:col-span-2 space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Circuit Board Visualization */}
            <CircuitBoardVisualization
              voltage={{
                txA: transactions[0].enabled ? transactions[0].value : 0,
                txB: transactions[1].enabled ? transactions[1].value : 0,
                txC: transactions[2].enabled ? transactions[2].value : 0,
                txRoot,
                policyCenter: policy.center,
                policyWidth: policy.width,
                digest: headBlock.digestV
              }}
              hardwareActive={hardwareState.connected || hardwareState.mockMode}
            />

            {/* Oscilloscope */}
            <Oscilloscope
              signals={[
                {
                  name: 'Tx Root',
                  voltage: txRoot * 3.3,
                  color: '#3b82f6',
                  visible: true
                },
                {
                  name: 'Policy Center',
                  voltage: policy.center * 3.3,
                  color: '#f59e0b',
                  visible: true
                },
                {
                  name: 'Digest',
                  voltage: headBlock.digestV * 3.3,
                  color: '#10b981',
                  visible: true
                },
                {
                  name: 'Hardware',
                  voltage: (hardwareState.connected || hardwareState.mockMode) ? 3.3 : 0,
                  color: '#ef4444',
                  visible: true
                }
              ]}
            />
          </motion.div>

          {/* Right Panel */}
          <div className="xl:col-span-1 space-y-8">
            {/* Voltage Monitoring */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gray-900 rounded-lg p-4 border border-blue-300"
            >
              <h4 className="text-white text-sm font-bold mb-4 text-center">
                🔬 VOLTAGE MONITORING
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <AnalogMeter
                  value={txRoot}
                  label="Tx Root"
                  color="#3b82f6"
                  size="sm"
                />
                <AnalogMeter
                  value={policy.center}
                  label="Policy"
                  color="#f59e0b"
                  size="sm"
                />
                <AnalogMeter
                  value={headBlock.digestV}
                  label="Digest"
                  color="#10b981"
                  size="sm"
                />
                <AnalogMeter
                  value={(hardwareState.connected || hardwareState.mockMode) ? 1 : 0}
                  label="Hardware"
                  color="#ef4444"
                  size="sm"
                />
              </div>
            </motion.div>

            {/* Hardware Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <HardwarePanel
                hardwareState={hardwareState}
                onHardwareStateChange={handleHardwareStateChange}
                onShowToast={showToast}
              />
            </motion.div>
          </div>
        </div>

        {/* Chain Visualization - Full Width */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ChainVisualization
            blocks={blocks}
            onTamperBlock={handleTamperBlock}
          />
        </motion.div>

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
