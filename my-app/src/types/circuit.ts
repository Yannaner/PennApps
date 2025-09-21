export interface CircuitComponent {
  id: string;
  type: 'resistor' | 'capacitor' | 'opamp' | 'comparator' | 'and' | 'or' | 'voltage_source' | 'led' | 'trace';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  value?: string;
  voltage?: number;
  active?: boolean;
  label?: string;
}

export interface VoltageTrace {
  id: string;
  points: { x: number; y: number }[];
  voltage: number;
  active: boolean;
  width: number;
}

export interface CircuitState {
  components: CircuitComponent[];
  traces: VoltageTrace[];
  voltageFlow: {
    txA: number;
    txB: number;
    txC: number;
    txRoot: number;
    policyCenter: number;
    policyWidth: number;
    digest: number;
    comparatorOutput: boolean;
  };
  animations: {
    flowingSignals: Array<{
      id: string;
      path: string;
      progress: number;
      voltage: number;
    }>;
  };
}