/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sword, Droplets, MapPin, Send, MessageSquare, AlertTriangle, Eye, Crosshair } from 'lucide-react';
import { gameService } from '../services/gameService';
import { Room, GamePhase, Player, Team, AllianceStrategy, EndState } from '../types';
import { STRATEGY_DESCRIPTIONS, TEAM_NAMES, STORY_BEATS } from '../constants';
import { cn } from '../lib/utils';
import { increment } from 'firebase/firestore';

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
  const [selectedStrategy, setSelectedStrategy] = useState<AllianceStrategy>(AllianceStrategy.UNASSIGNED);
  const [voted, setVoted] = useState(false);

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
            setSelectedStrategy(me.strategy);
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
    const id = await gameService.joinRoom(joinCode.toUpperCase(), playerName, userId);
    if (id) {
      setRoomId(id);
    } else {
      setError('Invalid code or room closed.');
    }
    setJoining(false);
  };

  const handleStrategySelect = async (strategy: AllianceStrategy) => {
    if (roomId) {
      await gameService.setPlayerStrategy(roomId, userId, strategy);
    }
  };

  const handleTap = () => {
    if (room && room.status === GamePhase.AMBUSH) {
      gameService.incrementAmbushTaps(room.id);
    }
  };

  const castVote = (isEradicate: boolean) => {
    if (room && !voted) {
      setVoted(true);
      if (isEradicate) {
        gameService.castVoteEradicate(room.id);
      } else {
        gameService.castVoteWithdraw(room.id);
      }
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
            <Shield className="w-12 h-12 text-[var(--gold)]" />
          </div>
          <h2 className="text-2xl font-bold uppercase text-center mb-8 tracking-tight">Tactical Uplink</h2>
          
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-[8px] uppercase tracking-widest opacity-50 mb-1 font-mono">Commander Designation</label>
              <input 
                type="text" 
                placeholder="YOUR NAME"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                className="w-full bg-transparent border-b border-[var(--gold)] p-3 text-sm focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-widest opacity-50 mb-1 font-mono">Transmission Code</label>
              <input 
                type="text" 
                placeholder="4-DIGIT CODE"
                maxLength={4}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-transparent border-b border-[var(--gold)] p-3 text-sm font-mono tracking-[1em] text-center focus:outline-none focus:border-white transition-colors uppercase"
                required
              />
            </div>
            
            {error && <p className="text-red-500 text-[10px] text-center uppercase">{error}</p>}

            <button 
              type="submit"
              disabled={joining}
              className="w-full bg-[var(--gold)] text-[var(--ink)] py-4 font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {joining ? 'TRANSMITTING...' : 'JOIN UNIFIED COMMAND'}
            </button>

            <button 
              type="button"
              onClick={onBack}
              className="w-full text-[var(--gold)]/50 text-[10px] uppercase font-mono mt-4 text-center hover:text-[var(--gold)]"
            >
              Abort Connection
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!room || !player) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <div className="font-mono text-sm animate-pulse text-[var(--gold)]">Decrypting Handshake...</div>
       </div>
    );
  }

  return (
    <div className="p-4 pt-24 min-h-screen relative overflow-hidden">
      <AnimatePresence mode="wait">
        {room.status === GamePhase.LOBBY && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center h-[60vh]"
          >
             <div className="font-mono text-xs uppercase text-[var(--gold)] animate-pulse tracking-widest">
                 Standby. Awaiting host initialization.
             </div>
          </motion.div>
        )}

        {room.status === GamePhase.ALLIANCE && (
          <motion.div 
            key="alliance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 relative z-10"
          >
            {/* Team/Strategy Assignment */}
            <div className="bg-[var(--ink)] p-6 border border-[var(--gold)]">
                <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Authenticated Commander</div>
                <div className="text-xl font-bold text-[var(--sand)] uppercase mb-4">{player.name}</div>
                
                {player.team ? (
                    <div className="p-4 bg-[var(--gold)]/10 border border-[var(--gold)]/30 mb-6">
                        <div className="text-[10px] uppercase tracking-widest text-[var(--gold)] mb-1">Assigned Faction</div>
                        <div className="text-lg font-bold text-[var(--sand)] uppercase">{TEAM_NAMES[player.team]}</div>
                    </div>
                ) : (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 mb-6 animate-pulse">
                        <div className="text-[10px] uppercase tracking-widest text-red-500">Awaiting Faction Assignment</div>
                    </div>
                )}

                <h3 className="text-xs uppercase tracking-tighter mb-4 text-[var(--sand)]">Lock In Operational Strategy</h3>
                <div className="grid grid-cols-1 gap-3">
                    {player.team && (
                        <button
                            onClick={() => handleStrategySelect(
                                player.team === Team.YEHUDAH ? AllianceStrategy.CAUTIOUS :
                                player.team === Team.YISRAEL ? AllianceStrategy.AGGRESSIVE :
                                AllianceStrategy.SCOUT
                            )}
                            className={cn(
                                "p-4 text-left border transition-all",
                                selectedStrategy !== AllianceStrategy.UNASSIGNED 
                                    ? "bg-[var(--gold)] border-[var(--gold)] text-[var(--ink)]" 
                                    : "bg-[var(--gold)]/20 border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)]/30"
                            )}
                        >
                            {(() => {
                                const strategy = player.team === Team.YEHUDAH ? AllianceStrategy.CAUTIOUS :
                                                 player.team === Team.YISRAEL ? AllianceStrategy.AGGRESSIVE :
                                                 AllianceStrategy.SCOUT;
                                return (
                                    <>
                                        <div className="font-bold uppercase text-sm mb-1">{STRATEGY_DESCRIPTIONS[strategy].name}</div>
                                        <div className="text-[10px] opacity-70 leading-tight mb-2">{STRATEGY_DESCRIPTIONS[strategy].desc}</div>
                                        <div className="text-[8px] font-mono text-[var(--gold)] uppercase bg-black/50 p-1 pl-2 border-l border-[var(--gold)] mix-blend-difference">{STRATEGY_DESCRIPTIONS[strategy].ability}</div>
                                        {selectedStrategy === AllianceStrategy.UNASSIGNED && (
                                            <div className="mt-4 text-center font-bold tracking-widest text-[10px] animate-pulse">TAP TO LOCK IN</div>
                                        )}
                                        {selectedStrategy !== AllianceStrategy.UNASSIGNED && (
                                            <div className="mt-4 text-center font-bold tracking-widest text-[10px] text-[var(--ink)]">LOCKED</div>
                                        )}
                                    </>
                                );
                            })()}
                        </button>
                    )}
                </div>
            </div>
            
            <div className="text-center text-[10px] uppercase tracking-widest text-[var(--ink)]/50 font-mono">
                Verify choices on the Unified Command Screen.
            </div>
          </motion.div>
        )}

        {room.status === GamePhase.TREK && (
           <motion.div 
             key="trek"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="flex flex-col gap-4 relative z-10"
           >
              <div className="flex flex-col items-center justify-center p-8 bg-[var(--ink)] border border-[var(--gold)] text-center min-h-[30vh]">
                  <Droplets className="w-16 h-16 text-blue-500 mb-6 opacity-50" />
                  <h2 className="text-2xl font-bold uppercase text-[var(--gold)] tracking-tighter mb-4">March through Edom</h2>
                  <div className="text-[10px] font-mono text-[var(--sand)] uppercase tracking-widest opacity-60">
                     Watch the Master Map. Monitor water reserves.
                  </div>
              </div>

              {/* Faction specific actions */}
              <div className="p-6 bg-[var(--ink)] border border-[var(--gold)]">
                  <h3 className="text-[10px] uppercase tracking-widest text-[var(--gold)] mb-4">Faction Action</h3>
                  {player.team === Team.YEHUDAH && (
                     <button 
                        onClick={() => gameService.updateGameState(room.id, { allianceIntegrity: Math.min(100, room.gameState.allianceIntegrity + 10) })}
                        className="w-full bg-red-800/20 border border-red-800 text-red-400 p-4 font-mono text-[10px] uppercase tracking-widest hover:bg-red-800/40"
                     >
                        Use Prophetic Insight (Boost Integrity)
                     </button>
                  )}
                  {player.team === Team.YISRAEL && (
                     <button 
                         onClick={() => {
                             gameService.updateGameState(room.id, { 
                                 stamina: Math.max(0, room.gameState.stamina - 5),
                                 water: Math.max(0, room.gameState.water - 5)
                             })
                         }}
                        className="w-full bg-blue-500/20 border border-blue-500 text-blue-400 p-4 font-mono text-[10px] uppercase tracking-widest hover:bg-blue-500/40"
                     >
                        Rapid Deployment (Sacrifice Resources for Speed)
                     </button>
                  )}
                  {player.team === Team.EDOM && (
                     <button 
                         onClick={() => gameService.updateGameState(room.id, { water: Math.min(100, room.gameState.water + 10) })}
                        className="w-full bg-stone-600/20 border border-stone-600 text-stone-400 p-4 font-mono text-[10px] uppercase tracking-widest hover:bg-stone-600/40"
                     >
                        Scout Terrain (Locate Minor Water Source)
                     </button>
                  )}
              </div>
           </motion.div>
        )}

        {room.status === GamePhase.CRISIS && (
            <motion.div 
                key="crisis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6 relative z-10"
            >
                <div className="bg-red-600/10 p-6 border border-red-600/40">
                    <h2 className="text-xl font-bold uppercase text-red-600 mb-2">EDUCATIONAL INTERVENTION</h2>
                    <p className="text-[var(--sand)]/80 text-sm mb-6">Wadi Paradox Detected. The army lacks water.</p>
                    
                    <div className="p-4 bg-black/50 border border-red-600/30">
                        <p className="text-[10px] text-[var(--sand)] opacity-60 leading-relaxed italic mb-4">
                            "They are not incompetent. The topography of the desert..."
                        </p>
                        <p className="text-xs font-bold uppercase tracking-tight text-red-500 mb-4">{STORY_BEATS.CRISIS.question}</p>
                        <div className="grid grid-cols-1 gap-2">
                             {STORY_BEATS.CRISIS.options.map((opt, i) => (
                                 <button 
                                    key={i} 
                                    onClick={() => {
                                      if (i === STORY_BEATS.CRISIS.correctIndex) {
                                        gameService.updateGameState(room.id, { crisisResolved: true, water: 100 });
                                        gameService.setGamePhase(room.id, GamePhase.MIRACLE);
                                      } else {
                                        gameService.updateGameState(room.id, { stamina: Math.max(0, room.gameState.stamina - 10) });
                                      }
                                    }}
                                    className="p-3 text-left border border-red-600/30 text-[var(--sand)] text-[10px] hover:bg-red-600/20 active:bg-green-600/20 transition-colors uppercase font-mono tracking-wider"
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
                className="flex flex-col items-center justify-center p-12 bg-blue-900/20 border border-blue-500/50 text-center min-h-[50vh]"
            >
                <Eye className="w-20 h-20 text-blue-400 mb-6 drop-shadow-[0_0_10px_rgba(0,100,255,0.8)]" />
                <h2 className="text-3xl font-bold uppercase text-blue-300 tracking-tighter mb-4">Miracle Active</h2>
                <div className="text-[10px] font-mono text-blue-200 uppercase tracking-widest">
                   The wadi is filled. Prepare for tactical execution.
                </div>
           </motion.div>
        )}

        {room.status === GamePhase.AMBUSH && (
             <motion.div 
                key="ambush"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-8 bg-[#300000] border-2 border-red-500 text-center min-h-[60vh] relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full p-2 flex justify-between">
                    <div className="text-[10px] text-red-500 font-mono uppercase tracking-widest opacity-50">Target: Moav Vanguard</div>
                    <div className="text-[10px] text-red-500 font-mono uppercase tracking-widest font-bold animate-pulse">AMBUSH IN PROGRESS</div>
                </div>

                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                  className="mb-8 mt-4"
                >
                  <Crosshair className="w-24 h-24 text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]" />
                </motion.div>

                <h2 className="text-4xl font-bold uppercase text-red-500 mb-2 tracking-tighter">SYNCHRONIZE STRIKE</h2>
                <p className="text-[10px] text-red-300 opacity-80 mb-12 uppercase font-mono tracking-widest max-w-[200px]">
                    Tap rapidly to increase ambush power!
                </p>

                <button 
                    className="group relative w-40 h-40 rounded-full border-4 border-red-500 flex items-center justify-center transition-all bg-red-600/20 active:scale-90 shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                    onPointerDown={handleTap}
                >
                    <Sword className="w-16 h-16 text-red-500 group-active:text-white" />
                </button>
            </motion.div>
        )}

        {room.status === GamePhase.CROSSROADS && (
             <motion.div 
                key="crossroads"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-6 bg-black border border-white/20 text-center min-h-[60vh]"
            >
                <AlertTriangle className="w-16 h-16 text-[var(--sand)] mb-6 opacity-30" />
                <h2 className="text-3xl font-bold uppercase text-[var(--sand)] tracking-tighter mb-4">Moral Crossroads</h2>
                <p className="text-xs text-[var(--sand)]/80 mb-12 italic tracking-widest uppercase">
                  Consensus Vote Required
                </p>

                {voted ? (
                   <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 p-4 bg-[#C5A059]/10">
                     Vote logged. Awaiting total consensus on Unified Command.
                   </div>
                ) : (
                  <div className="w-full space-y-4">
                      <button 
                          disabled={voted}
                          onClick={() => castVote(true)}
                          className="w-full bg-[#8B0000]/10 border border-[#8B0000]/50 p-6 flex flex-col items-center hover:bg-[#8B0000]/30 transition-colors"
                      >
                          <span className="text-lg font-bold text-[#8B0000] uppercase mb-1">Total Eradication</span>
                          <span className="text-[8px] uppercase tracking-widest font-mono text-[#8B0000]/60">Press the advantage</span>
                      </button>
                      <button 
                          disabled={voted}
                          onClick={() => castVote(false)}
                          className="w-full bg-blue-900/10 border border-blue-500/50 p-6 flex flex-col items-center hover:bg-blue-900/30 transition-colors"
                      >
                          <span className="text-lg font-bold text-blue-400 uppercase mb-1">Moral Withdrawal</span>
                          <span className="text-[8px] uppercase tracking-widest font-mono text-blue-400/60">Cease fire. Retreat from Moav</span>
                      </button>
                  </div>
                )}
            </motion.div>
        )}

        {room.status === GamePhase.END && (
             <motion.div 
                key="end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center h-[60vh]"
            >
                <div className="text-[10px] font-mono text-[var(--sand)] uppercase tracking-widest">
                   Simulation Terminated. Observe Main Display.
                </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
