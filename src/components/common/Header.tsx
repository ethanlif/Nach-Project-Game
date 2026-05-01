/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Swords, Map as MapIcon, Droplets, Sparkles, Trophy } from 'lucide-react';
import { GamePhase } from '../../types';
import { COLORS } from '../../constants';

interface GameHeaderProps {
  phase: GamePhase;
}

const PHASE_INFO = {
  [GamePhase.LOBBY]: { icon: Swords, text: "Gathering the Alliance" },
  [GamePhase.REBELLION]: { icon: MapIcon, text: "The Rebellion of Mesha" },
  [GamePhase.CRISIS]: { icon: Droplets, text: "The Water Crisis" },
  [GamePhase.MIRACLE]: { icon: Sparkles, text: "Elisha's Promise" },
  [GamePhase.VICTORY]: { icon: Trophy, text: "The Victory at Moav" },
  [GamePhase.END]: { icon: Trophy, text: "Victory Achieved" }
};

export const GameHeader: React.FC<GameHeaderProps> = ({ phase }) => {
  const info = PHASE_INFO[phase] || { icon: Swords, text: "The Moav Siege" };
  const Icon = info.icon;

  return (
    <header className="fixed top-0 left-0 w-full p-4 z-50 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-3 bg-[var(--ink)] text-[var(--sand)] px-6 py-3 border border-[var(--gold)] shadow-lg pointer-events-auto">
        <Icon className="w-5 h-5 text-[var(--gold)]" />
        <span className="font-mono text-sm tracking-[0.2em] uppercase font-bold">
          {info.text}
        </span>
      </div>
      <div className="flex items-center gap-4 bg-[var(--ink)] text-[var(--sand)] px-6 py-3 border border-[var(--gold)] shadow-lg pointer-events-auto">
         <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-tighter opacity-50">Military Intel</span>
            <span className="font-mono text-xs uppercase">{phase}</span>
         </div>
      </div>
    </header>
  );
};
