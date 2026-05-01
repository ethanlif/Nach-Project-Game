/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sword, Users, Shield } from 'lucide-react';

interface LandingViewProps {
  onSelectHost: () => void;
  onSelectPlayer: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSelectHost, onSelectPlayer }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
    >
      <motion.div 
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <Shield className="w-16 h-16 text-[var(--gold)]" />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter uppercase mb-4 text-[var(--ink)]">
            Kings of the Desert
          </h1>
          <p className="text-[var(--gold)] font-mono text-sm tracking-[0.34em] uppercase">
            The Alliance Against Moav (2 Kings 3)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <button 
            onClick={onSelectHost}
            className="group relative bg-[var(--ink)] text-[var(--sand)] p-8 border border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-all duration-300 overflow-hidden"
          >
            <div className="relative z-10">
              <Shield className="w-8 h-8 mb-4 mx-auto" />
              <h2 className="text-xl font-bold uppercase mb-2">Game Master</h2>
              <p className="text-xs opacity-60 font-mono">Create a room and host the campaign screen.</p>
            </div>
          </button>

          <button 
            onClick={onSelectPlayer}
            className="group relative bg-[var(--ink)] text-[var(--sand)] p-8 border border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-all duration-300 overflow-hidden"
          >
            <div className="relative z-10">
              <Sword className="w-8 h-8 mb-4 mx-auto" />
              <h2 className="text-xl font-bold uppercase mb-2">Commander</h2>
              <p className="text-xs opacity-60 font-mono">Join the alliance and command your team's tactical units.</p>
            </div>
          </button>
        </div>

        <div className="mt-12 text-[10px] uppercase tracking-widest opacity-30 font-mono">
          Educational Multi-User Tactical Simulation v1.0
        </div>
      </motion.div>
    </motion.div>
  );
};
