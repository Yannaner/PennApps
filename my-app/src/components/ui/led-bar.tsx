'use client';

import { cn } from '@/lib/utils';

interface LEDBarProps {
  value: number; // Normalized value 0-1
  className?: string;
  segments?: number; // Default 10
  greenTint?: boolean; // For valid digests
  roseTint?: boolean; // For invalid digests
}

export function LEDBar({ 
  value, 
  className, 
  segments = 10, 
  greenTint = false, 
  roseTint = false 
}: LEDBarProps) {
  // Calculate how many segments should be lit
  const litSegments = Math.floor(value * segments);
  
  // Base colors
  const baseColor = greenTint 
    ? 'bg-green-500' 
    : roseTint 
    ? 'bg-rose-500' 
    : 'bg-blue-500';
  
  const dimColor = greenTint 
    ? 'bg-green-200' 
    : roseTint 
    ? 'bg-rose-200' 
    : 'bg-gray-300';

  return (
    <div className={cn('flex gap-0.5', className)}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 w-2 rounded-sm transition-all duration-300 ease-out transform',
            i < litSegments 
              ? `${baseColor} scale-105 shadow-sm` 
              : `${dimColor} scale-100`
          )}
          style={{
            transitionDelay: `${i * 20}ms`
          }}
        />
      ))}
    </div>
  );
}