'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnalogMeterProps {
  value: number; // 0-1 range
  label: string;
  unit?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showDigital?: boolean;
}

export function AnalogMeter({ 
  value, 
  label, 
  unit = 'V', 
  color = '#10b981',
  size = 'md',
  showDigital = true
}: AnalogMeterProps) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const angle = -90 + (clampedValue * 180); // -90 to +90 degrees
  const voltage = clampedValue * 3.3;
  
  const sizes = {
    sm: { width: 80, height: 80, fontSize: 10 },
    md: { width: 120, height: 120, fontSize: 12 },
    lg: { width: 160, height: 160, fontSize: 14 }
  };
  
  const { width, height, fontSize } = sizes[size];
  const radius = width * 0.35;
  const centerX = width / 2;
  const centerY = height * 0.7;

  // Generate arc path for the meter background
  const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
  
  // Calculate needle tip position
  const needleLength = radius * 0.8;
  const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <div 
        className="relative bg-gray-900 rounded-full border-4 border-gray-700 shadow-lg"
        style={{ width, height }}
      >
        <svg width={width} height={height} className="absolute inset-0">
          {/* Meter background arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="#374151"
            strokeWidth={8}
            strokeLinecap="round"
          />
          
          {/* Value arc */}
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${clampedValue * 180} 180`}
            opacity={0.8}
          />
          
          {/* Scale marks */}
          {Array.from({ length: 9 }, (_, i) => {
            const markAngle = -90 + (i * 22.5);
            const markRadius = radius * 0.9;
            const markX1 = centerX + markRadius * Math.cos((markAngle * Math.PI) / 180);
            const markY1 = centerY + markRadius * Math.sin((markAngle * Math.PI) / 180);
            const markX2 = centerX + (markRadius - 8) * Math.cos((markAngle * Math.PI) / 180);
            const markY2 = centerY + (markRadius - 8) * Math.sin((markAngle * Math.PI) / 180);
            
            return (
              <line
                key={i}
                x1={markX1}
                y1={markY1}
                x2={markX2}
                y2={markY2}
                stroke="#9ca3af"
                strokeWidth={i % 2 === 0 ? 2 : 1}
              />
            );
          })}
          
          {/* Scale numbers */}
          {Array.from({ length: 5 }, (_, i) => {
            const markAngle = -90 + (i * 45);
            const markRadius = radius * 0.75;
            const markX = centerX + markRadius * Math.cos((markAngle * Math.PI) / 180);
            const markY = centerY + markRadius * Math.sin((markAngle * Math.PI) / 180);
            const markValue = (i * 0.825).toFixed(1);
            
            return (
              <text
                key={i}
                x={markX}
                y={markY + 4}
                textAnchor="middle"
                fill="#d1d5db"
                fontSize={fontSize - 2}
                fontFamily="monospace"
              >
                {markValue}
              </text>
            );
          })}
          
          {/* Needle */}
          <motion.line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="#ef4444"
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          />
          
          {/* Center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r={4}
            fill="#ef4444"
            stroke="#1f2937"
            strokeWidth={2}
          />
          
          {/* Needle shadow */}
          <motion.line
            x1={centerX}
            y1={centerY}
            x2={needleX + 1}
            y2={needleY + 1}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          />
        </svg>
        
        {/* Label */}
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center"
        >
          <div className="text-white font-mono text-xs">{label}</div>
        </div>
      </div>
      
      {/* Digital readout */}
      {showDigital && (
        <motion.div 
          className="mt-2 bg-black border border-green-400 rounded px-3 py-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-green-400 font-mono text-sm">
            {voltage.toFixed(2)}{unit}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}