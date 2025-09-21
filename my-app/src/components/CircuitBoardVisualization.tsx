'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import { CircuitComponent, VoltageTrace } from '@/types/circuit';
import { motion } from 'framer-motion';

interface CircuitBoardVisualizationProps {
  voltage: {
    txA: number;
    txB: number;
    txC: number;
    txRoot: number;
    policyCenter: number;
    policyWidth: number;
    digest: number;
  };
  hardwareActive: boolean;
}

export function CircuitBoardVisualization({
  voltage,
  hardwareActive
}: CircuitBoardVisualizationProps) {
  const stageRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [animationFrame, setAnimationFrame] = useState(0);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: 800, height: 600 });
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Animation loop for flowing signals
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 100);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Circuit components layout
  const components: CircuitComponent[] = [
    // Transaction input voltage sources
    { id: 'tx_a_source', type: 'voltage_source', x: 50, y: 100, width: 40, height: 20, label: 'Tx A', voltage: voltage.txA },
    { id: 'tx_b_source', type: 'voltage_source', x: 50, y: 160, width: 40, height: 20, label: 'Tx B', voltage: voltage.txB },
    { id: 'tx_c_source', type: 'voltage_source', x: 50, y: 220, width: 40, height: 20, label: 'Tx C', voltage: voltage.txC },
    
    // Summing amplifier for transaction root
    { id: 'sum_amp', type: 'opamp', x: 200, y: 160, width: 60, height: 40, label: 'Σ', voltage: voltage.txRoot },
    
    // Hash computation section
    { id: 'hash_proc', type: 'opamp', x: 350, y: 200, width: 60, height: 40, label: 'HASH', voltage: voltage.digest },
    
    // Policy comparators
    { id: 'comp_low', type: 'comparator', x: 500, y: 120, width: 50, height: 30, label: 'CMP-', voltage: voltage.policyCenter - voltage.policyWidth/2 },
    { id: 'comp_high', type: 'comparator', x: 500, y: 180, width: 50, height: 30, label: 'CMP+', voltage: voltage.policyCenter + voltage.policyWidth/2 },
    
    // AND gate for window validation
    { id: 'and_gate', type: 'and', x: 600, y: 150, width: 40, height: 30, label: 'AND' },
    
    // Output LED
    { id: 'valid_led', type: 'led', x: 700, y: 155, width: 20, height: 20, label: 'VALID', 
      active: voltage.digest >= (voltage.policyCenter - voltage.policyWidth/2) && 
              voltage.digest <= (voltage.policyCenter + voltage.policyWidth/2) },
  ];

  // Voltage traces connecting components
  const traces: VoltageTrace[] = [
    // Tx inputs to summer
    { id: 'trace_a', points: [{ x: 90, y: 110 }, { x: 150, y: 110 }, { x: 180, y: 150 }], voltage: voltage.txA, active: voltage.txA > 0, width: 3 },
    { id: 'trace_b', points: [{ x: 90, y: 170 }, { x: 150, y: 170 }, { x: 180, y: 170 }], voltage: voltage.txB, active: voltage.txB > 0, width: 3 },
    { id: 'trace_c', points: [{ x: 90, y: 230 }, { x: 150, y: 230 }, { x: 180, y: 190 }], voltage: voltage.txC, active: voltage.txC > 0, width: 3 },
    
    // Summer to hash processor
    { id: 'trace_sum', points: [{ x: 260, y: 180 }, { x: 320, y: 180 }, { x: 350, y: 220 }], voltage: voltage.txRoot, active: voltage.txRoot > 0, width: 4 },
    
    // Hash to comparators
    { id: 'trace_hash_low', points: [{ x: 410, y: 220 }, { x: 470, y: 220 }, { x: 500, y: 135 }], voltage: voltage.digest, active: true, width: 4 },
    { id: 'trace_hash_high', points: [{ x: 410, y: 220 }, { x: 470, y: 220 }, { x: 500, y: 195 }], voltage: voltage.digest, active: true, width: 4 },
    
    // Comparators to AND gate
    { id: 'trace_comp_out', points: [{ x: 550, y: 155 }, { x: 600, y: 155 }], voltage: 1, active: true, width: 3 },
    
    // AND to LED
    { id: 'trace_output', points: [{ x: 640, y: 165 }, { x: 700, y: 165 }], voltage: 1, active: true, width: 4 },
  ];

  // Render voltage source component
  const renderVoltageSource = (comp: CircuitComponent) => (
    <Group key={comp.id}>
      <Circle
        x={comp.x + comp.width/2}
        y={comp.y + comp.height/2}
        radius={comp.width/2}
        fill={comp.voltage && comp.voltage > 0 ? '#22c55e' : '#e5e7eb'}
        stroke="#374151"
        strokeWidth={2}
      />
      <Text
        x={comp.x - 10}
        y={comp.y - 20}
        text={comp.label}
        fontSize={10}
        fill="#374151"
        fontFamily="Arial"
      />
      <Text
        x={comp.x - 5}
        y={comp.y + comp.height + 5}
        text={`${(comp.voltage || 0).toFixed(2)}V`}
        fontSize={8}
        fill="#6b7280"
        fontFamily="monospace"
      />
    </Group>
  );

  // Render op-amp component
  const renderOpAmp = (comp: CircuitComponent) => (
    <Group key={comp.id}>
      <Line
        points={[
          comp.x, comp.y,
          comp.x + comp.width, comp.y + comp.height/2,
          comp.x, comp.y + comp.height,
          comp.x, comp.y
        ]}
        fill={comp.voltage && comp.voltage > 0 ? '#dbeafe' : '#f3f4f6'}
        stroke="#374151"
        strokeWidth={2}
        closed={true}
      />
      <Text
        x={comp.x + 5}
        y={comp.y + comp.height/2 - 5}
        text={comp.label}
        fontSize={12}
        fill="#374151"
        fontFamily="Arial"
        fontStyle="bold"
      />
      <Text
        x={comp.x}
        y={comp.y + comp.height + 5}
        text={`${(comp.voltage || 0).toFixed(2)}V`}
        fontSize={8}
        fill="#6b7280"
        fontFamily="monospace"
      />
    </Group>
  );

  // Render comparator component
  const renderComparator = (comp: CircuitComponent) => (
    <Group key={comp.id}>
      <Rect
        x={comp.x}
        y={comp.y}
        width={comp.width}
        height={comp.height}
        fill={comp.voltage && comp.voltage > 0 ? '#fef3c7' : '#f3f4f6'}
        stroke="#374151"
        strokeWidth={2}
        cornerRadius={4}
      />
      <Text
        x={comp.x + 5}
        y={comp.y + comp.height/2 - 5}
        text={comp.label}
        fontSize={10}
        fill="#374151"
        fontFamily="Arial"
      />
    </Group>
  );

  // Render logic gate component
  const renderLogicGate = (comp: CircuitComponent) => (
    <Group key={comp.id}>
      <Rect
        x={comp.x}
        y={comp.y}
        width={comp.width}
        height={comp.height}
        fill="#e0e7ff"
        stroke="#374151"
        strokeWidth={2}
        cornerRadius={4}
      />
      <Text
        x={comp.x + comp.width/2 - 10}
        y={comp.y + comp.height/2 - 5}
        text={comp.label}
        fontSize={10}
        fill="#374151"
        fontFamily="Arial"
        fontStyle="bold"
      />
    </Group>
  );

  // Render LED component
  const renderLED = (comp: CircuitComponent) => (
    <Group key={comp.id}>
      <Circle
        x={comp.x + comp.width/2}
        y={comp.y + comp.height/2}
        radius={comp.width/2}
        fill={comp.active ? '#ef4444' : '#fca5a5'}
        stroke="#374151"
        strokeWidth={2}
      />
      {comp.active && (
        <Circle
          x={comp.x + comp.width/2}
          y={comp.y + comp.height/2}
          radius={comp.width/2 + 3}
          fill="transparent"
          stroke="#ef4444"
          strokeWidth={1}
          opacity={0.6}
        />
      )}
      <Text
        x={comp.x - 5}
        y={comp.y - 15}
        text={comp.label}
        fontSize={10}
        fill="#374151"
        fontFamily="Arial"
      />
    </Group>
  );

  // Render voltage trace with flowing animation
  const renderTrace = (trace: VoltageTrace) => {
    const color = trace.active && trace.voltage > 0 
      ? `hsl(${Math.min(trace.voltage * 120, 120)}, 70%, 50%)`
      : '#d1d5db';
    
    const points = trace.points.flatMap(p => [p.x, p.y]);
    
    return (
      <Group key={trace.id}>
        <Line
          points={points}
          stroke={color}
          strokeWidth={trace.width}
          opacity={trace.active ? 0.8 : 0.3}
        />
        {/* Flowing signal animation */}
        {trace.active && trace.voltage > 0 && (
          <Circle
            x={trace.points[0].x + (trace.points[trace.points.length - 1].x - trace.points[0].x) * ((animationFrame % 50) / 50)}
            y={trace.points[0].y + (trace.points[trace.points.length - 1].y - trace.points[0].y) * ((animationFrame % 50) / 50)}
            radius={3}
            fill="#fbbf24"
            opacity={0.8}
          />
        )}
      </Group>
    );
  };

  // Render component based on type
  const renderComponent = (comp: CircuitComponent) => {
    switch (comp.type) {
      case 'voltage_source':
        return renderVoltageSource(comp);
      case 'opamp':
        return renderOpAmp(comp);
      case 'comparator':
        return renderComparator(comp);
      case 'and':
      case 'or':
        return renderLogicGate(comp);
      case 'led':
        return renderLED(comp);
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-green-900 rounded-lg p-4 overflow-hidden"
      style={{ minHeight: '400px' }}
    >
      <div className="mb-4">
        <h3 className="text-white text-lg font-semibold mb-2">Live Circuit Board Visualization</h3>
        <div className="flex gap-4 text-sm text-green-200">
          <span>Real-time voltage flow</span>
          <span>•</span>
          <span>Analog signal processing</span>
          <span>•</span>
          <span className={hardwareActive ? 'text-yellow-300' : 'text-green-200'}>
            Hardware: {hardwareActive ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>
      
      <div className="bg-green-800 rounded-lg p-2">
        <Stage width={dimensions.width} height={dimensions.height} ref={stageRef}>
          <Layer>
            {/* PCB Background */}
            <Rect
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill="#1f2937"
              stroke="#374151"
              strokeWidth={1}
            />
            
            {/* Grid pattern for PCB */}
            {Array.from({ length: Math.floor(dimensions.width / 20) }, (_, i) => (
              <Line
                key={`grid-v-${i}`}
                points={[i * 20, 0, i * 20, dimensions.height]}
                stroke="#374151"
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
            {Array.from({ length: Math.floor(dimensions.height / 20) }, (_, i) => (
              <Line
                key={`grid-h-${i}`}
                points={[0, i * 20, dimensions.width, i * 20]}
                stroke="#374151"
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
            
            {/* Render traces first (behind components) */}
            {traces.map(renderTrace)}
            
            {/* Render components */}
            {components.map(renderComponent)}
            
            {/* Title */}
            <Text
              x={20}
              y={20}
              text="CryptoLab Analog Blockchain Circuit"
              fontSize={16}
              fill="#e5e7eb"
              fontFamily="Arial"
              fontStyle="bold"
            />
            
            <Text
              x={20}
              y={40}
              text="Real-time voltage processing and signal flow visualization"
              fontSize={12}
              fill="#9ca3af"
              fontFamily="Arial"
            />
          </Layer>
        </Stage>
      </div>
    </motion.div>
  );
}