/**
 * Real blockchain service that connects to the bridge.py backend
 * This replaces the simulated blockchain service with actual hardware integration
 */

// Backend API configuration
const BACKEND_URL = 'http://localhost:8787';
const WS_URL = 'ws://localhost:8787';

// Types for backend communication
export interface BackendTransaction {
  from_addr: string | null;
  to: string;
  amt: number;
}

export interface BlockchainState {
  round: number;
  leader: number;
  blockHeight: number;
  balances: Record<string, number>;
  mempool: BackendTransaction[];
  ports: string[];
  threshold: number;
}

export interface BlockchainEvent {
  type: 'state' | 'chal' | 'witness' | 'commit' | 'skip';
  round?: number;
  leader?: number;
  seed?: number;
  durMs?: number;
  node?: number;
  corr?: number;
  includedTx?: BackendTransaction[];
  balances?: Record<string, number>;
  blockHeight?: number;
  mempool?: BackendTransaction[];
  ports?: string[];
  threshold?: number;
}

export interface ControlAction {
  action: 'start' | 'stop' | 'reset';
}

class RealBlockchainService {
  private wsConnection: WebSocket | null = null;
  private eventListeners: Map<string, ((event: BlockchainEvent) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentState: BlockchainState | null = null;

  constructor() {
    this.initializeWebSocket();
  }

  /**
   * Initialize WebSocket connection to backend
   */
  private initializeWebSocket() {
    try {
      this.wsConnection = new WebSocket(`${WS_URL}/events`);

      this.wsConnection.onopen = () => {
        console.log('🔗 Connected to blockchain backend');
        this.reconnectAttempts = 0;
        this.emit('connection', { type: 'state' });
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data: BlockchainEvent = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (error) {
          console.error('Failed to parse blockchain event:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('🔌 Disconnected from blockchain backend');
        this.emit('connection', { type: 'state' });
        this.attemptReconnect();
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect to the backend
   */
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Handle incoming blockchain events
   */
  private handleEvent(event: BlockchainEvent) {
    // Update current state if this is a state event
    if (event.type === 'state') {
      this.currentState = {
        round: event.round || 0,
        leader: event.leader || 0,
        blockHeight: event.blockHeight || 0,
        balances: event.balances || {},
        mempool: event.mempool || [],
        ports: event.ports || [],
        threshold: event.threshold || 0.6
      };
    }

    // Emit event to listeners
    this.emit(event.type, event);
    this.emit('all', event);
  }

  /**
   * Add event listener
   */
  public addEventListener(eventType: string, callback: (event: BlockchainEvent) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(eventType: string, callback: (event: BlockchainEvent) => void) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, event: BlockchainEvent) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * Send transaction to the blockchain backend
   */
  public async sendTransaction(from: string, to: string, amount: number): Promise<{ ok: boolean }> {
    try {
      const transaction: BackendTransaction = {
        from_addr: from,
        to: to,
        amt: amount
      };

      const response = await fetch(`${BACKEND_URL}/tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new Error('Failed to send transaction to blockchain backend');
    }
  }

  /**
   * Get current blockchain state
   */
  public async getState(): Promise<BlockchainState> {
    try {
      const response = await fetch(`${BACKEND_URL}/state`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const state = await response.json();
      this.currentState = state;
      return state;
    } catch (error) {
      console.error('Failed to get blockchain state:', error);
      // Return cached state if available
      if (this.currentState) {
        return this.currentState;
      }
      throw new Error('Failed to get blockchain state');
    }
  }

  /**
   * Control blockchain (start/stop/reset)
   */
  public async controlBlockchain(action: 'start' | 'stop' | 'reset'): Promise<{ ok: boolean }> {
    try {
      const controlAction: ControlAction = { action };

      const response = await fetch(`${BACKEND_URL}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(controlAction)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to control blockchain:', error);
      throw new Error('Failed to control blockchain');
    }
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current cached state (synchronous)
   */
  public getCurrentState(): BlockchainState | null {
    return this.currentState;
  }

  /**
   * Disconnect from backend
   */
  public disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.eventListeners.clear();
  }

  /**
   * Map backend balance to frontend user balance
   */
  public getUserBalance(userEmail: string): number {
    if (!this.currentState) return 0;
    
    // Map email to blockchain addresses
    // This is a simple mapping - in production you'd want a more sophisticated system
    const addressMap: Record<string, string> = {
      'alice@example.com': 'Alice',
      'bob@example.com': 'Bob',
      'treasury@example.com': 'Treasury'
    };

    const address = addressMap[userEmail];
    return address ? (this.currentState.balances[address] || 0) : 0;
  }

  /**
   * Map user email to blockchain address
   */
  public getBlockchainAddress(userEmail: string): string {
    // Simple mapping - in production you'd want a more sophisticated system
    const addressMap: Record<string, string> = {
      'alice@example.com': 'Alice',
      'bob@example.com': 'Bob',
      'treasury@example.com': 'Treasury'
    };

    return addressMap[userEmail] || userEmail.split('@')[0];
  }
}

// Export singleton instance
export const realBlockchainService = new RealBlockchainService();