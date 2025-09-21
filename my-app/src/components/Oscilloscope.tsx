'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-konva';
import { motion } from 'framer-motion';

interface OscilloscopeProps {
  signals: {
    name: string;
    voltage: number;
    color: string;
    visible: boolean;
  }[];
  width?: number;
  height?: number;
  timeScale?: number;
}

export function Oscilloscope({ 
  signals, 
  width = 400, 
  height = 200,
  timeScale = 100
}: OscilloscopeProps) {
  const [waveformData, setWaveformData] = useState<Record<string, number[]>>({});
  const [timeIndex, setTimeIndex] = useState(0);

  // Update waveform data
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformData(prev => {
        const newData = { ...prev };
        
        signals.forEach(signal => {
          if (!newData[signal.name]) {
            newData[signal.name] = [];
          }
          
          // Add new voltage sample
          newData[signal.name].push(signal.voltage);
          
          // Keep only last 100 samples for performance
          if (newData[signal.name].length > 100) {
            newData[signal.name].shift();
          }
        });
        
        return newData;
      });
      
      setTimeIndex(prev => prev + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [signals]);

  // Generate waveform points for a signal
  const generateWaveformPoints = (data: number[], signalName: string) => {
    if (!data || data.length < 2) return [];
    
    const points: number[] = [];
    const stepX = width / (data.length - 1);
    const centerY = height / 2;
    const scaleY = height / 6.6; // Scale for 0-3.3V range
    
    data.forEach((voltage, index) => {
      const x = index * stepX;
      const y = centerY - (voltage * scaleY);
      points.push(x, y);
    });
    
    return points;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black rounded-lg p-4 border border-green-400"
    >
      <div className="mb-3">
        <h4 className="text-green-400 text-sm font-mono font-bold mb-2">
          OSCILLOSCOPE - Voltage Analysis
        </h4>
        <div className="flex gap-3 text-xs">
          {signals.map(signal => (
            <div key={signal.name} className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: signal.visible ? signal.color : '#555' }}
              />
              <span className="text-green-300 font-mono">
                {signal.name}: {signal.voltage.toFixed(2)}V
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="relative bg-gray-900 rounded border border-green-600">
        <svg width={width} height={height} className="block">
          {/* Grid */}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={`h-grid-${i}`}
              x1={0}
              y1={(i * height) / 10}
              x2={width}
              y2={(i * height) / 10}
              stroke="#1f4b3f"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={`v-grid-${i}`}
              x1={(i * width) / 10}
              y1={0}
              x2={(i * width) / 10}
              y2={height}
              stroke="#1f4b3f"
              strokeWidth={0.5}
            />
          ))}
          
          {/* Center line */}
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="#10b981"
            strokeWidth={1}
            opacity={0.5}
          />
          
          {/* Voltage scale labels */}
          <text x={5} y={15} fill="#10b981" fontSize="10" fontFamily="monospace">3.3V</text>
          <text x={5} y={height / 2 + 5} fill="#10b981" fontSize="10" fontFamily="monospace">1.65V</text>
          <text x={5} y={height - 5} fill="#10b981" fontSize="10" fontFamily="monospace">0V</text>
          
          {/* Waveforms */}
          {signals.map(signal => {
            if (!signal.visible || !waveformData[signal.name]) return null;
            
            const points = generateWaveformPoints(waveformData[signal.name], signal.name);
            if (points.length < 4) return null;
            
            return (
              <polyline
                key={signal.name}
                points={points.join(' ')}
                fill="none"
                stroke={signal.color}
                strokeWidth={2}
                opacity={0.8}
              />
            );
          })}
          
          {/* Scanning line */}
          <line
            x1={(timeIndex * 4) % width}
            y1={0}
            x2={(timeIndex * 4) % width}
            y2={height}
            stroke="#22d3ee"
            strokeWidth={1}
            opacity={0.6}
          />
        </svg>
        
        {/* Trigger indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-cyan-400 text-xs font-mono">TRIG</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="mt-2 flex justify-between text-xs text-green-400 font-mono">
        <span>Time: {timeScale}ms/div</span>
        <span>Volt: 0.5V/div</span>
        <span>Samples: {Object.values(waveformData)[0]?.length || 0}</span>
      </div>
    </motion.div>
  );
}