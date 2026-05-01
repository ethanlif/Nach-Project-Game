/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sword, Droplets, MapPin, Send, MessageSquare } from 'lucide-react';
import { gameService } from '../services/gameService';
import { Room, GamePhase, Player, Team, PlayerRole } from '../types';
import { ROLE_DESCRIPTIONS, TEAM_NAMES, STORY_BEATS } from '../constants';
import { cn } from '../lib/utils';

interface PlayerViewProps {
  userId: string;
  onChangePhase: (phase: GamePhase) => void;
  onBack: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ userId, onChangePhase, onBack }) => {
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<PlayerRole>(PlayerRole.UNASSIGNED);

  // Auto-join from URL if code present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code) setJoinCode(code);
  }, []);

  useEffect(() => {
    if (roomId) {
      const unsubRoom = gameService.subscribeToRoom(roomId, (updatedRoom) => {
        setRoom(updatedRoom);
        onChangePhase(updatedRoom.status);
      });
      const unsubPlayers = gameService.subscribeToPlayers(roomId, (players) => {
        const me = players.find(p => p.id === userId);
        if (me) {
            setPlayer(me);
            setSelectedRole(me.role);
        }
      });
      return () => {
        unsubRoom();
        unsubPlayers();
      };
    }
  }, [roomId, userId, onChangePhase]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !playerName) return;
    setJoining(true);
    setError('');
    const id = await gameService.joinRoom(joinCode, playerName, userId);
    if (id) {
      setRoomId(id);
    } else {
      setError('Invalid code or room closed.');
    }
    setJoining(false);
  };

  const handleRoleSelect = async (role: PlayerRole) => {
    if (roomId) {
      await gameService.setPlayerRole(roomId, userId, role);
    }
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-sm bg-[var(--ink)] text-[var(--sand)] p-8 border border-[var(--gold)] shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <Sword className="w-12 h-12 text-[var(--gold)]" />
          </div>
          <h2 className="text-2xl font-bold uppercase text-center mb-8 tracking-tight">Alliance Mobilization</h2>
          
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-[8px] uppercase tracking-widest opacity-50 mb-1 font-mono">Identification</label>
              <input 
                type="text" 
                placeholder="COMMANDER NAME"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                className="w-full bg-transparent border-b border-[var(--gold)] p-3 text-sm focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-widest opacity-50 mb-1 font-mono">Tactical Code</label>
              <input 
                type="text" 
                placeholder="4-DIGIT CODE"
                maxLength={4}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-transparent border-b border-[var(--gold)] p-3 text-sm font-mono tracking-[1em] text-center focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>
            
            {error && <p className="text-red-500 text-[10px] text-center uppercase">{error}</p>}

            <button 
              type="submit"
              disabled={joining}
              className="w-full bg-[var(--gold)] text-[var(--ink)] py-4 font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {joining ? 'TRANSMITTING...' : 'JOIN COMMAND'}
            </button>

            <button 
              type="button"
              onClick={onBack}
              className="w-full text-[var(--gold)]/50 text-[10px] uppercase font-mono mt-4 text-center hover:text-[var(--gold)]"
            >
              Back to Main
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!room || !player) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <div className="font-mono text-sm animate-pulse">Syncing with HQ...</div>
       </div>
    );
  }

  return (
    <div className="p-4 pt-24 min-h-screen">
      <AnimatePresence mode="wait">
        {room.status === GamePhase.LOBBY && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Team/Role Assignment */}
            <div className="bg-[var(--ink)] p-6 border border-[var(--gold)]">
                <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Authenticated User</div>
                <div className="text-xl font-bold text-[var(--sand)] uppercase mb-4">{player.name}</div>
                
                {player.team ? (
                    <div className="p-4 bg-[var(--gold)]/10 border border-[var(--gold)]/30 mb-6">
                        <div className="text-[10px] uppercase tracking-widest text-[var(--gold)] mb-1">Assigned Kingdom</div>
                        <div className="text-lg font-bold text-[var(--sand)] uppercase">{TEAM_NAMES[player.team]}</div>
                    </div>
                ) : (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 mb-6 animate-pulse">
                        <div className="text-[10px] uppercase tracking-widest text-red-500">Awaiting Deployment</div>
                    </div>
                )}

                <h3 className="text-xs uppercase tracking-tighter mb-4 text-[var(--sand)]">Specialization</h3>
                <div className="grid grid-cols-1 gap-3">
                    {[PlayerRole.SCOUT, PlayerRole.WATER_BEARER, PlayerRole.TACTICIAN].map(role => (
                        <button
                            key={role}
                            onClick={() => handleRoleSelect(role)}
                            className={cn(
                                "p-4 text-left border transition-all",
                                selectedRole === role 
                                    ? "bg-[var(--gold)] border-[var(--gold)] text-[var(--ink)]" 
                                    : "bg-transparent border-[var(--gold)]/30 text-[var(--sand)] hover:bg-[var(--gold)]/5"
                            )}
                        >
                            <div className="font-bold uppercase text-sm mb-1">{role}</div>
                            <div className="text-[10px] opacity-70 leading-tight">{ROLE_DESCRIPTIONS[role]}</div>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="text-center text-[10px] uppercase tracking-widest text-[var(--ink)]/50 font-mono">
                Observe the Great Screen for further orders.
            </div>
          </motion.div>
        )}

        {room.status === GamePhase.REBELLION && (
           <motion.div 
             key="rebellion"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="space-y-6"
           >
                <div className="bg-[var(--ink)] p-6 border border-[var(--gold)]">
                    <h2 className="text-xl font-bold uppercase text-[var(--gold)] mb-2">{STORY_BEATS.REBELLION.title}</h2>
                    <p className="text-[var(--sand)]/80 text-sm mb-6">{STORY_BEATS.REBELLION.conflict}</p>
                    
                    <div className="p-4 border border-[var(--gold)]/20 bg-white/5 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-tight">{STORY_BEATS.REBELLION.question}</p>
                        <div className="grid grid-cols-1 gap-2">
                             {STORY_BEATS.REBELLION.options.map((opt, i) => (
                                 <button 
                                    key={i} 
                                    onClick={() => {
                                      if (i === STORY_BEATS.REBELLION.correctIndex) {
                                        gameService.updateGameState(room.id, { morale: Math.min(100, (room.gameState.morale || 100) + 10) });
                                      }
                                    }}
                                    className="p-3 text-left border border-[var(--gold)]/30 text-[var(--sand)] text-xs hover:bg-[var(--gold)]/10 active:bg-green-600/20"
                                  >
                                     {opt}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>
           </motion.div>
        )}

        {room.status === GamePhase.CRISIS && (
            <motion.div 
                key="crisis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
            >
                <div className="bg-red-600/10 p-6 border border-red-600/40">
                    <h2 className="text-xl font-bold uppercase text-red-600 mb-2">{STORY_BEATS.CRISIS.title}</h2>
                    <p className="text-[var(--sand)]/80 text-sm mb-6">{STORY_BEATS.CRISIS.problem}</p>
                    
                    <div className="p-4 border border-red-600/30 bg-black/20 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-tight text-red-500">Logistics Puzzle</p>
                        <p className="text-[10px] text-[var(--sand)] opacity-60 leading-relaxed italic">
                            Analyzing wadi topography... Rabbi Alex Israel notes: The army wouldn't make a simple error.
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                             {STORY_BEATS.CRISIS.options.map((opt, i) => (
                                 <button 
                                    key={i} 
                                    onClick={() => {
                                      if (i === STORY_BEATS.CRISIS.correctIndex) {
                                        gameService.updateGameState(room.id, { water: 100, crisisSolved: true });
                                      }
                                    }}
                                    className="p-3 text-left border border-red-600/30 text-[var(--sand)] text-xs hover:bg-red-600/20 active:bg-green-600/20 transition-colors"
                                >
                                     {opt}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>
           </motion.div>
        )}

        {room.status === GamePhase.MIRACLE && (
             <motion.div 
                key="miracle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
            >
                <div className="bg-blue-600/10 p-6 border border-blue-600/40">
                    <h2 className="text-xl font-bold uppercase text-blue-400 mb-2">{STORY_BEATS.MIRACLE.title}</h2>
                    <p className="text-[var(--sand)]/80 text-sm mb-6">"Is there not here a prophet of Hashem?"</p>
                    
                    <div className="p-4 border border-blue-600/30 bg-black/20 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-tight text-blue-400">Consult the Prophet</p>
                        <div className="grid grid-cols-1 gap-2">
                             {STORY_BEATS.MIRACLE.options.map((opt, i) => (
                                 <button 
                                    key={i} 
                                    onClick={() => {
                                      if (i === STORY_BEATS.MIRACLE.correctIndex) {
                                        gameService.updateGameState(room.id, { morale: 100, miracleTriggered: true });
                                      }
                                    }}
                                    className="p-3 text-left border border-blue-600/30 text-[var(--sand)] text-xs hover:bg-blue-600/20 active:bg-green-600/20"
                                >
                                     {opt}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>
           </motion.div>
        )}

        {room.status === GamePhase.VICTORY && (
             <motion.div 
                key="victory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-8 bg-[var(--ink)] border border-[var(--gold)] text-center"
            >
                <Trophy className="w-16 h-16 text-[var(--gold)] mb-4" />
                <h2 className="text-3xl font-bold uppercase text-[var(--gold)] mb-2">Victory</h2>
                <p className="text-xs text-[var(--sand)] opacity-60 mb-8 lowercase font-mono italic">
                    The Moabite army was deceived by the red water. The siege of Kir-Hareseth is won.
                </p>
                <button 
                    className="flex items-center gap-2 px-8 py-3 bg-[var(--gold)] text-[var(--ink)] font-bold uppercase text-xs tracking-widest animate-pulse"
                    onClick={() => gameService.updateGameState(room.id, { victoryAchieved: true })}
                >
                    <Sword className="w-4 h-4" />
                    Final Charge
                </button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
