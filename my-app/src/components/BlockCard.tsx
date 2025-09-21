'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LEDBar } from '@/components/ui/led-bar';
import { Block } from '@/types/blockchain';
import { toVoltage } from '@/lib/blockchain';
import { CircuitBoard, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlockCardProps {
  block: Block;
  isHead?: boolean;
  onTamper?: (blockId: number) => void;
}

export function BlockCard({ block, isHead = false, onTamper }: BlockCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4,
        type: "spring",
        stiffness: 120,
        damping: 20
      }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-2 transition-all duration-200 group-hover:border-blue-300 group-hover:shadow-lg">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircuitBoard className="w-4 h-4 text-blue-500" />
              <span className="font-mono text-sm font-medium">Block #{block.id}</span>
            </div>
            <Badge 
              variant={block.valid ? "default" : "destructive"}
              className={block.valid ? "bg-green-500" : "bg-red-500"}
            >
              {block.valid ? "VALID" : "INVALID"}
            </Badge>
          </div>

          {/* Prev Hash */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Prev Hash</span>
              <span className="font-mono">{toVoltage(block.prevV)}V</span>
            </div>
            <LEDBar value={block.prevV} />
          </div>

          {/* Tx Root */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tx Root</span>
              <span className="font-mono">{toVoltage(block.rootV)}V</span>
            </div>
            <LEDBar value={block.rootV} />
          </div>

          {/* Sequence */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Sequence</span>
            <span className="font-mono text-lg font-bold">
              {block.seq.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Digest */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Digest</span>
              <span className="font-mono">{toVoltage(block.digestV)}V</span>
            </div>
            <LEDBar 
              value={block.digestV} 
              greenTint={block.valid}
              roseTint={!block.valid}
            />
          </div>

          {/* Head indicator */}
          {isHead && (
            <div className="pt-2 border-t border-dashed">
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Zap className="w-3 h-3" />
                <span>Head of chain — next block will ingest this digest as Prev</span>
              </div>
            </div>
          )}

          {/* Tamper button (for demo purposes) */}
          {onTamper && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTamper(block.id)}
              className="w-full text-xs text-orange-600 hover:text-orange-700"
            >
              Tamper (Demo)
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}