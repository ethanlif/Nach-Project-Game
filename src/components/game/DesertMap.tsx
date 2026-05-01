/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Users } from 'lucide-react';
import { Team } from '../../types';

interface DesertMapProps {
  progress: number; // 0-100
  teams: { [key in Team]: number }; // percentage progress for each team
}

export const DesertMap: React.FC<DesertMapProps> = ({ progress, teams }) => {
  // Simple grid-based desert map
  const grid = Array.from({ length: 49 }).map((_, i) => i);

  return (
    <div className="relative w-full aspect-video bg-[var(--desert)] border border-[var(--ink)]/20 overflow-hidden shadow-inner">
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
      </svg>

      {/* Locations */}
      <div className="absolute left-[5%] top-1/2 -translate-y-1/2 text-center">
        <div className="w-8 h-8 bg-[var(--ink)] border border-[var(--gold)] flex items-center justify-center mx-auto">
            <MapPin className="w-4 h-4 text-[var(--gold)]" />
        </div>
        <span className="text-[8px] font-mono uppercase mt-1 block">Samaria</span>
      </div>

      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 text-center">
        <div className="w-8 h-8 bg-[#8B0000] border border-[var(--gold)] flex items-center justify-center mx-auto">
            <Users className="w-4 h-4 text-white" />
        </div>
        <span className="text-[8px] font-mono uppercase mt-1 block">Kir-Hareseth</span>
      </div>

      {/* Alliance Pointer */}
      <motion.div 
        className="absolute top-1/2 -ml-6 -mt-10"
        style={{ left: `${5 + (progress * 0.9)}%` }}
        transition={{ type: 'spring', stiffness: 50 }}
      >
        <div className="bg-[var(--gold)] text-[var(--ink)] p-2 border border-[var(--ink)] shadow-lg flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-tight">Alliance</span>
            <div className="flex gap-1 mt-1">
                <div className="w-1 h-3 bg-blue-500" />
                <div className="w-1 h-3 bg-red-800" />
                <div className="w-1 h-3 bg-black" />
            </div>
        </div>
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[var(--gold)] mx-auto" />
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
