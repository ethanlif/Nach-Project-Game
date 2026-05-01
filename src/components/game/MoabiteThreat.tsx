/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Skull } from 'lucide-react';

interface MoabiteThreatProps {
  intensity: number; // 0-100
}

export const MoabiteThreat: React.FC<MoabiteThreatProps> = ({ intensity }) => {
  return (
    <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-2 pointer-events-none">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[8px] uppercase tracking-widest text-[#8B0000] font-bold">Enemy Recon</span>
          <span className="text-xs font-mono text-[var(--sand)]">ARMY OF MOAV</span>
        </div>
        <div className="p-3 bg-[#8B0000] border border-[var(--gold)]">
          <Skull className="w-5 h-5 text-white" />
        </div>
      </div>
      
      <div className="w-48 h-1 bg-[#8B0000]/20 mt-2">
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${intensity}%` }}
            className="h-full bg-[#8B0000]"
        />
      </div>
      <span className="text-[8px] uppercase tracking-tighter text-[#8B0000] animate-pulse">Threat Level: {intensity > 50 ? 'CRITICAL' : 'MODERATE'}</span>
    </div>
  );
};
