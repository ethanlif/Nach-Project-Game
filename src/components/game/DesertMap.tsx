/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Users } from 'lucide-react';
import { Team, GamePhase } from '../../types';
import { cn } from '../../lib/utils';

interface DesertMapProps {
  progress: number; // 0-100
  teams?: { [key in Team]: number }; // percentage progress for each team
  phase?: GamePhase;
  crisisResolved?: boolean;
}

export const DesertMap: React.FC<DesertMapProps> = ({ progress, teams, phase, crisisResolved }) => {
  // Simple grid-based desert map
  const grid = Array.from({ length: 49 }).map((_, i) => i);

  // Visual filters based on phase
  const getMapFilter = () => {
    if (phase === GamePhase.MIRACLE) return 'hue-rotate-180 brightness-75 contrast-125 sepia-[.5]'; // Shifts to deep blue/red
    if (phase === GamePhase.AMBUSH) return 'sepia-[.8] saturate-200 hue-rotate-[-30deg] brightness-50'; // Deep Blood Red
    if (phase === GamePhase.END || phase === GamePhase.CROSSROADS) return 'grayscale brightness-50';
    return '';
  };

  return (
    <div className={cn("relative w-full aspect-video bg-[var(--desert)] border border-[var(--ink)]/20 overflow-hidden shadow-inner transition-all duration-1000", getMapFilter())}>
      {/* Terrain texture/blobs */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 800 450">
          <path d="M100 100 Q 200 50 300 150 T 500 100" stroke="var(--gold)" fill="none" strokeWidth="1" />
          <path d="M0 300 Q 150 250 250 350 T 450 300" stroke="var(--gold)" fill="none" strokeWidth="1" />
          <circle cx="650" cy="150" r="40" fill="var(--gold)" opacity="0.3" />
        </svg>
      </div>

      {/* Grid Lines */}
      <div className="absolute inset-0 grid grid-cols-7 grid-rows-7 opacity-5">
        {grid.map(i => (
          <div key={i} className="border border-[var(--ink)]" />
        ))}
      </div>

      <div className={cn("absolute inset-0 transition-opacity duration-1000", phase === GamePhase.MIRACLE ? "bg-red-900/30" : "opacity-0")} />

      {/* Journey Path */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <motion.path 
            d="M 50,225 L 750,225"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeDasharray="10,5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 1 }}
        />
        {/* Miracle Active Indicator */}
        {phase === GamePhase.MIRACLE && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          >
             {/* Draw water filling the wadi path */}
            <path 
                d="M 350,225 L 750,225"
                fill="none" 
                stroke="#8B0000" /* Appears blood red */
                strokeWidth="6" 
                strokeLinecap="round"
                className="animate-pulse opacity-80"
            />
          </motion.g>
        )}
      </svg>

      {/* Locations */}
      <div className="absolute left-[5%] top-1/2 -translate-y-1/2 text-center">
        <div className="w-8 h-8 bg-[var(--ink)] border border-[var(--gold)] flex items-center justify-center mx-auto">
            <MapPin className="w-4 h-4 text-[var(--gold)]" />
        </div>
        <span className="text-[8px] font-mono uppercase mt-1 block font-bold text-[var(--ink)]">Samaria</span>
      </div>

      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 text-center">
        <div className="w-8 h-8 bg-[#8B0000] border border-[var(--gold)] flex items-center justify-center mx-auto">
            <Users className="w-4 h-4 text-white" />
        </div>
        <span className="text-[8px] font-mono uppercase mt-1 block font-bold text-[#8B0000]">Kir-Hareseth</span>
      </div>

       {/* Water Crisis Indicator */}
       {phase === GamePhase.CRISIS && !crisisResolved && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
          >
            <div className="w-24 h-24 rounded-full border-2 border-red-600 border-dashed animate-spin-slow"></div>
            <span className="absolute font-mono text-[8px] uppercase font-bold text-red-600 bg-black/50 p-1">CRITICAL WADI</span>
          </motion.div>
        )}

      {/* Alliance Pointer */}
      <motion.div 
        className="absolute top-1/2 -ml-6 -mt-10"
        style={{ left: `${5 + (progress * 0.9)}%` }}
        transition={{ type: 'spring', stiffness: 50 }}
      >
        <div className={cn("text-[var(--ink)] p-2 border shadow-lg flex flex-col items-center", phase === GamePhase.MIRACLE ? "bg-red-900 border-red-500 text-white" : "bg-[var(--gold)] border-[var(--ink)]")}>
            <span className="text-[10px] font-bold uppercase tracking-tight">Alliance</span>
            <div className="flex gap-1 mt-1">
                <div className="w-1 h-3 bg-blue-500" />
                <div className="w-1 h-3 bg-red-800" />
                <div className="w-1 h-3 bg-black" />
            </div>
        </div>
        <div className={cn("w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mx-auto", phase === GamePhase.MIRACLE ? "border-t-red-900" : "border-t-[var(--gold)]")} />
      </motion.div>

      {/* Sandstorm Effect */}
      <motion.div 
        animate={{ x: [-20, 20, -20], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute inset-0 bg-white/10 blur-3xl pointer-events-none"
      />
    </div>
  );
};
