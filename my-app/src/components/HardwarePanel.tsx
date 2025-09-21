'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HardwareState } from '@/types/blockchain';
import { Usb, Wifi, WifiOff, Send, Terminal } from 'lucide-react';

// Web Serial API types
declare global {
  interface Navigator {
    serial: Serial;
  }
  
  interface Serial {
    requestPort(): Promise<SerialPort>;
  }
  
  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
  }
}

interface HardwarePanelProps {
  hardwareState: HardwareState;
  onHardwareStateChange: (state: Partial<HardwareState>) => void;
  onShowToast?: (message: string) => void;
}

export function HardwarePanel({ 
  hardwareState, 
  onHardwareStateChange,
  onShowToast
}: HardwarePanelProps) {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check Web Serial API support
  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'serial' in navigator);
  }, []);

  // Read incoming data
  const readLoop = useCallback(async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value).trim();
        if (text) {
          onHardwareStateChange({
            console: [...hardwareState.console, `< ${text}`]
          });
        }
      }
    } catch (error) {
      console.error('Read error:', error);
    } finally {
      reader.releaseLock();
    }
  }, [hardwareState.console, onHardwareStateChange]);

  // Connect to device
  const connectDevice = useCallback(async () => {
    if (!isSupported) {
      onHardwareStateChange({ mockMode: true });
      onShowToast?.('Web Serial not supported. Enabling Mock Mode.');
      return;
    }

    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      
      setPort(selectedPort);
      onHardwareStateChange({ 
        connected: true, 
        mockMode: false,
        console: [...hardwareState.console, 'Device connected']
      });
      
      // Set up reader for incoming data
      const reader = selectedPort.readable?.getReader();
      if (reader) {
        readLoop(reader);
      }
      
    } catch (error) {
      console.error('Failed to connect:', error);
      onHardwareStateChange({ mockMode: true });
      onShowToast?.('Connection failed. Enabling Mock Mode.');
    }
  }, [isSupported, hardwareState.console, onHardwareStateChange, onShowToast, readLoop]);

  // Disconnect device
  const disconnectDevice = useCallback(async () => {
    if (port) {
      try {
        await port.close();
        setPort(null);
        onHardwareStateChange({ 
          connected: false, 
          mockMode: false,
          console: [...hardwareState.console, 'Device disconnected']
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    } else {
      onHardwareStateChange({ mockMode: false });
    }
  }, [port, hardwareState.console, onHardwareStateChange]);

  // Send signal to hardware
  const sendSignal = useCallback(async () => {
    const timestamp = new Date().toLocaleTimeString();
    
    if (hardwareState.connected && port) {
      try {
        const writer = port.writable?.getWriter();
        if (writer) {
          const command = 'LATCH\n';
          await writer.write(new TextEncoder().encode(command));
          writer.releaseLock();
          
          onHardwareStateChange({
            lastSignalTime: Date.now(),
            console: [...hardwareState.console, `> ${command.trim()}`]
          });
          
          onShowToast?.(`Signal sent at ${timestamp}`);
        }
      } catch (error) {
        console.error('Send error:', error);
        onShowToast?.('Failed to send signal');
      }
    } else if (hardwareState.mockMode) {
      onHardwareStateChange({
        lastSignalTime: Date.now(),
        console: [...hardwareState.console, `> LATCH (mock) at ${timestamp}`]
      });
      onShowToast?.(`Mock signal sent at ${timestamp}`);
    }
  }, [hardwareState.connected, hardwareState.mockMode, hardwareState.console, port, onHardwareStateChange, onShowToast]);

  const getStatusBadge = () => {
    if (hardwareState.connected) {
      return <Badge variant="default" className="bg-green-500"><Wifi className="w-3 h-3 mr-1" />Connected</Badge>;
    } else if (hardwareState.mockMode) {
      return <Badge variant="secondary"><Terminal className="w-3 h-3 mr-1" />Mock Mode</Badge>;
    } else {
      return <Badge variant="outline"><WifiOff className="w-3 h-3 mr-1" />Disconnected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Usb className="w-5 h-5" />
          Hardware Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Device Status</span>
          {getStatusBadge()}
        </div>

        {/* Connection Controls */}
        <div className="flex gap-2">
          {!hardwareState.connected && !hardwareState.mockMode ? (
            <Button onClick={connectDevice} variant="outline" className="flex-1">
              <Usb className="w-4 h-4 mr-2" />
              Connect Device
            </Button>
          ) : (
            <Button onClick={disconnectDevice} variant="outline" className="flex-1">
              Disconnect
            </Button>
          )}
        </div>

        {/* Send Signal */}
        <div className="space-y-2">
          <Button 
            onClick={sendSignal}
            disabled={!hardwareState.connected && !hardwareState.mockMode}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Signal to Hardware
          </Button>
          
          {hardwareState.lastSignalTime && (
            <p className="text-xs text-muted-foreground text-center">
              Last signal: {new Date(hardwareState.lastSignalTime).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Console */}
        {hardwareState.console.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Console</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onHardwareStateChange({ console: [] })}
              >
                Clear
              </Button>
            </div>
            <div className="bg-black text-green-400 font-mono text-xs p-3 rounded-md max-h-32 overflow-y-auto">
              {hardwareState.console.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* Web Serial Support Warning */}
        {!isSupported && (
          <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-md p-2">
            Web Serial API not supported in this browser. Hardware functionality will use Mock Mode.
          </div>
        )}
      </CardContent>
    </Card>
  );
}