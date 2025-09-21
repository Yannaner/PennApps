'use client';

import { Block } from '@/types/blockchain';
import { BlockCard } from '@/components/BlockCard';
import { motion } from 'framer-motion';

interface ChainVisualizationProps {
  blocks: Block[];
  onTamperBlock?: (blockId: number) => void;
}

export function ChainVisualization({ blocks, onTamperBlock }: ChainVisualizationProps) {
  if (blocks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No blocks in chain</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="space-y-4">
      <motion.h3 
        className="text-lg font-semibold"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Chain Visualization
      </motion.h3>
      <motion.div 
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {blocks.map((block, index) => (
          <motion.div
            key={block.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <BlockCard
              block={block}
              isHead={index === blocks.length - 1}
              onTamper={onTamperBlock}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}