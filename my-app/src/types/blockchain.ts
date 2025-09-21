export interface Block {
  id: number;
  prevV: number; // Previous block's digest voltage (0-1)
  rootV: number; // Transaction root voltage (0-1)
  seq: number; // Sequence counter
  digestV: number; // This block's digest voltage (0-1)
  valid: boolean; // Whether this block is valid according to current policy
}

export interface Transaction {
  id: 'A' | 'B' | 'C';
  value: number; // Voltage value
  enabled: boolean;
}

export interface PolicyWindow {
  center: number; // Center of validity window (0-1)
  width: number; // Width of validity window (0.05-0.5)
}

export type ChainStatus = 'idle' | 'compute' | 'verify' | 'append';

export interface HardwareState {
  connected: boolean;
  mockMode: boolean;
  lastSignalTime: number | null;
  console: string[];
}