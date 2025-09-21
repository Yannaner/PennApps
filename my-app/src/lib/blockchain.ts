import { Block, Transaction, PolicyWindow } from '@/types/blockchain';

// Convert normalized value (0-1) to voltage display (0-3.3V)
export const toVoltage = (normalized: number): string => {
  return (normalized * 3.3).toFixed(2);
};

// Clamp value to range [min, max]
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Calculate transaction root from enabled transactions
export const calculateTxRoot = (transactions: Transaction[]): number => {
  const sum = transactions
    .filter(tx => tx.enabled)
    .reduce((acc, tx) => acc + tx.value, 0);
  return clamp(sum, 0, 1);
};

// Deterministic analog-inspired digest calculation
// Uses smooth deterministic transform with sinusoidal shaping
export const calculateDigest = (
  prevDigest: number,
  txRoot: number,
  seq: number,
  policyCenter: number
): number => {
  // Weighted mix of inputs
  const mix = 0.3 * prevDigest + 0.25 * txRoot + 0.1 * (seq / 100) + 0.35 * policyCenter;
  
  // Apply sinusoidal shaping for analog feel
  const shaped = 0.5 + 0.4 * Math.sin(mix * Math.PI * 2) + 0.1 * Math.cos(mix * Math.PI * 4);
  
  return clamp(shaped, 0, 1);
};

// Check if digest is within policy window
export const isValidDigest = (digest: number, policy: PolicyWindow): boolean => {
  const lo = clamp(policy.center - policy.width / 2, 0, 1);
  const hi = clamp(policy.center + policy.width / 2, 0, 1);
  return digest >= lo && digest <= hi;
};

// Get policy window bounds
export const getPolicyBounds = (policy: PolicyWindow): { lo: number; hi: number } => {
  const lo = clamp(policy.center - policy.width / 2, 0, 1);
  const hi = clamp(policy.center + policy.width / 2, 0, 1);
  return { lo, hi };
};

// Verify a block against current policy (with analog tolerance)
export const verifyBlock = (
  block: Block,
  policyCenter: number,
  tolerance: number = 0.025
): boolean => {
  const expectedDigest = calculateDigest(block.prevV, block.rootV, block.seq, policyCenter);
  return Math.abs(expectedDigest - block.digestV) < tolerance;
};

// Create genesis block
export const createGenesisBlock = (): Block => ({
  id: 1,
  prevV: 0.42,
  rootV: 0.35,
  seq: 0,
  digestV: 0.50,
  valid: true
});

// Create a new block
export const createBlock = (
  id: number,
  prevDigest: number,
  txRoot: number,
  seq: number,
  policyCenter: number,
  policy: PolicyWindow
): Block => {
  const digestV = calculateDigest(prevDigest, txRoot, seq, policyCenter);
  const valid = isValidDigest(digestV, policy);
  
  return {
    id,
    prevV: prevDigest,
    rootV: txRoot,
    seq,
    digestV,
    valid
  };
};