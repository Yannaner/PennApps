'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LEDBar } from '@/components/ui/led-bar';
import { Transaction, PolicyWindow, ChainStatus } from '@/types/blockchain';
import { toVoltage, getPolicyBounds } from '@/lib/blockchain';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  transactions: Transaction[];
  onTransactionToggle: (id: 'A' | 'B' | 'C') => void;
  txRoot: number;
  policy: PolicyWindow;
  onPolicyChange: (policy: PolicyWindow) => void;
  sequence: number;
  onSequenceChange: (seq: number) => void;
  status: ChainStatus;
  onAddBlock: () => void;
  onVerifyChain: () => void;
  onReset: () => void;
}

export function ControlPanel({
  transactions,
  onTransactionToggle,
  txRoot,
  policy,
  onPolicyChange,
  sequence,
  onSequenceChange,
  status,
  onAddBlock,
  onVerifyChain,
  onReset
}: ControlPanelProps) {
  const { lo, hi } = getPolicyBounds(policy);

  const statusMessages = {
    idle: 'Ready to process',
    compute: 'Computing digest...',
    verify: 'Verifying policy...',
    append: 'Appending block...'
  };

  return (
    <div className="space-y-6">
      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={tx.enabled}
                  onCheckedChange={() => onTransactionToggle(tx.id)}
                />
                <span className="font-mono">Tx {tx.id} = {tx.value.toFixed(2)}</span>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tx Root</span>
              <span className="font-mono text-sm">{toVoltage(txRoot)}V</span>
            </div>
            <LEDBar value={txRoot} />
          </div>
        </CardContent>
      </Card>

      {/* Policy Window */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Window</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Center</span>
              <span className="font-mono text-sm">{policy.center.toFixed(3)}</span>
            </div>
            <Slider
              value={[policy.center]}
              onValueChange={([value]) => onPolicyChange({ ...policy, center: value })}
              max={1}
              min={0}
              step={0.01}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Width</span>
              <span className="font-mono text-sm">{policy.width.toFixed(3)}</span>
            </div>
            <Slider
              value={[policy.width]}
              onValueChange={([value]) => onPolicyChange({ ...policy, width: value })}
              max={0.5}
              min={0.05}
              step={0.01}
              className="w-full"
            />
          </div>

          <div className="pt-2 border-t text-sm">
            <p className="mb-1">Valid if digest ∈ [{lo.toFixed(3)} … {hi.toFixed(3)}]</p>
            <p className="text-muted-foreground font-mono">
              [{toVoltage(lo)}V … {toVoltage(hi)}V]
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sequence & Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Sequence & Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Sequence Counter</label>
            <Input
              type="number"
              value={sequence}
              onChange={(e) => onSequenceChange(parseInt(e.target.value) || 0)}
              className="font-mono"
              min={0}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onAddBlock}
              disabled={status !== 'idle'}
              className="flex-1"
            >
              Add Block
            </Button>
            <Button
              variant="outline"
              onClick={onVerifyChain}
              disabled={status !== 'idle'}
            >
              Verify Chain
            </Button>
            <Button
              variant="ghost"
              onClick={onReset}
              disabled={status !== 'idle'}
            >
              Reset
            </Button>
          </div>

          <div className={cn(
            'text-sm p-2 rounded-md transition-all duration-300 flex items-center gap-2',
            status === 'idle' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          )}>
            {status !== 'idle' && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
            <span>Status: {statusMessages[status]}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}