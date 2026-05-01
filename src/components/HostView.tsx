/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { Users, Play, LogOut, Shield, Map as MapIcon, Droplets, Sparkles, Trophy, Sword, AlertTriangle } from 'lucide-react';
import { gameService } from '../services/gameService';
import { Room, GamePhase, Player, Team } from '../types';
import { COLORS, TEAM_NAMES, STORY_BEATS } from '../constants';
import { cn } from '../lib/utils';
import { DesertMap } from './game/DesertMap';
import { MoabiteThreat } from './game/MoabiteThreat';

interface HostViewProps {
  userId: string;
  onChangePhase: (phase: GamePhase) => void;
  onBack: () => void;
}

export const HostView: React.FC<HostViewProps> = ({ userId, onChangePhase, onBack }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const initRoom = async () => {
      const id = await gameService.createRoom(userId);
      setRoomId(id);
      setLoading(false);
    };
    initRoom();
  }, [userId]);

  useEffect(() => {
    if (roomId) {
      const unsubRoom = gameService.subscribeToRoom(roomId, (updatedRoom) => {
        setRoom(updatedRoom);
        onChangePhase(updatedRoom.status);
      });
      const unsubPlayers = gameService.subscribeToPlayers(roomId, (updatedPlayers) => {
        setPlayers(updatedPlayers);
      });
      return () => {
        unsubRoom();
        unsubPlayers();
      };
    }
  }, [roomId, onChangePhase]);

  // Game Loop Ticker
  useEffect(() => {
    if (!room || room.status === GamePhase.LOBBY || room.status === GamePhase.END) return;

    const interval = setInterval(() => {
      setTicker(t => t + 1);
      
      // Automatic stamina drain during Trek
      if (room.status === GamePhase.REBELLION && room.gameState.stamina > 0) {
        gameService.updateGameState(room.id, { 
          stamina: Math.max(0, room.gameState.stamina - 0.2) 
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room]);

  const handleStartGame = async () => {
    if (roomId && players.length >= 1) {
      await gameService.assignTeams(roomId, players);
      await gameService.setGamePhase(roomId, GamePhase.REBELLION);
    }
  };

  const handleNextPhase = async () => {
    if (!room) return;
    const phases = [
      GamePhase.LOBBY,
      GamePhase.REBELLION,
      GamePhase.CRISIS,
      GamePhase.MIRACLE,
      GamePhase.VICTORY,
      GamePhase.END
    ];
    const currentIndex = phases.indexOf(room.status);
    if (currentIndex < phases.length - 1) {
      await gameService.setGamePhase(room.id, phases[currentIndex + 1]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="font-mono animate-pulse uppercase tracking-widest text-[#C5A059]">Inaugurating War Room...</div>
      </div>
    );
  }

  if (!room) return null;

  const trekProgress = room.status === GamePhase.REBELLION ? Math.min(100, (ticker / 60) * 100) : 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 pt-24 min-h-screen grid grid-cols-12 gap-8"
    >
      <MoabiteThreat intensity={room.status === GamePhase.VICTORY ? 20 : (ticker % 30) * 3} />

      {/* Left Panel: Status & Controls */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
        <div className="bg-[var(--ink)] text-[var(--sand)] p-6 border border-[var(--gold)] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--gold)]/10 -mr-8 -mt-8 rotate-45" />

          <div className="flex items-center gap-2 mb-6 opacity-60">
            <Shield className="w-4 h-4" />
            <span className="text-[8px] uppercase tracking-widest font-mono">Operations Command</span>
          </div>

          <div className="mb-8">
            <h1 className="text-5xl font-bold font-mono tracking-tighter mb-2 text-[var(--gold)]">{room.code}</h1>
            <p className="text-[8px] uppercase tracking-[0.4em] opacity-40">Entry Permissions</p>
          </div>

          <div className="mb-8 p-4 bg-white/5 border border-[var(--gold)]/20 flex flex-col items-center group transition-all hover:bg-white/10">
            <QRCodeCanvas 
              value={`${window.location.origin}?join=${room.code}`} 
              size={120}
              bgColor="transparent"
              fgColor={COLORS.gold}
              className="mb-4"
            />
            <p className="text-[9px] text-center uppercase tracking-wider opacity-60 font-mono">Secure Transmission Node</p>
          </div>

          <div className="space-y-3">
            {room.status === GamePhase.LOBBY ? (
              <button 
                onClick={handleStartGame}
                disabled={players.length === 0}
                className="w-full bg-[var(--gold)] text-[var(--ink)] py-4 font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Initialize
              </button>
            ) : (
              <button 
                onClick={handleNextPhase}
                disabled={room.status === GamePhase.END}
                className="w-full bg-[var(--accent)] text-[var(--ink)] py-4 font-bold uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-20"
              >
                Next Strategic Beat
              </button>
            )}

            <button 
              onClick={onBack}
              className="w-full border border-[var(--gold)]/30 text-[var(--gold)] py-3 text-xs font-bold uppercase tracking-widest hover:bg-[var(--gold)]/10 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3 h-3" />
              Abandon
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="bg-[var(--ink)] text-[var(--sand)] p-6 border border-[var(--gold)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] uppercase tracking-tighter opacity-50 font-mono">Tactical Vitals</h3>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="space-y-5">
            <StatBar label="Stamina" value={room.gameState.stamina} color="bg-[var(--gold)]" icon={MapIcon} />
            <StatBar label="Water" value={room.gameState.water} color="bg-blue-500" icon={Droplets} />
            <StatBar label="Morale" value={room.gameState.morale} color="bg-green-600" icon={Sparkles} />
          </div>
        </div>
      </div>

      {/* Main Content: Map & Players */}
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
        {/* Game Phase View */}
        <div className="flex-1 bg-[var(--ink)] border border-[var(--gold)] relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={room.status}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full flex flex-col"
                >
                    {room.status === GamePhase.LOBBY && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 6, repeat: Infinity }}
                            >
                                <Users className="w-24 h-24 mb-6 text-[var(--gold)] opacity-30" />
                            </motion.div>
                            <h2 className="text-4xl font-bold uppercase text-[var(--sand)] mb-4 tracking-tighter">Awaiting Royal Officers</h2>
                            <p className="text-[var(--gold)] font-mono text-sm uppercase tracking-widest border-t border-[var(--gold)]/20 pt-4 px-8">
                                {players.length} Alliance Units Confirmed
                            </p>
                        </div>
                    )}

                    {room.status === GamePhase.REBELLION && (
                         <div className="flex-1 flex flex-col p-8">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold uppercase text-[var(--gold)] tracking-tighter">{STORY_BEATS.REBELLION.title}</h2>
                                    <p className="text-[var(--sand)]/60 text-xs uppercase font-mono">Marching for 7 days through the wilderness of Edom</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase text-[var(--gold)] opacity-50 mb-1">Fleet Progress</div>
                                    <div className="text-xl font-mono text-[var(--sand)]">{Math.floor(trekProgress)}%</div>
                                </div>
                            </div>
                            
                            <div className="flex-1 border border-[var(--gold)]/20 relative">
                                <DesertMap progress={trekProgress} teams={{ [Team.YISRAEL]: 0, [Team.YEHUDAH]: 0, [Team.EDOM]: 0 }} />
                            </div>

                            <div className="mt-6 flex flex-col gap-4 max-w-2xl mx-auto">
                                <p className="text-[var(--sand)]/80 text-sm italic border-l-2 border-[var(--gold)] pl-4 py-2">
                                    "{STORY_BEATS.REBELLION.conflict}"
                                </p>
                            </div>
                         </div>
                    )}

                    {room.status === GamePhase.CRISIS && (
                         <div className="flex-1 flex flex-col p-12 items-center justify-center text-center">
                            <AlertTriangle className="w-20 h-20 text-red-600 mb-6 animate-bounce" />
                            <h2 className="text-5xl font-bold uppercase text-red-600 mb-6 tracking-tighter">{STORY_BEATS.CRISIS.title}</h2>
                            <div className="max-w-2xl bg-red-600/10 p-8 border border-red-600/30">
                                <p className="text-xl text-[var(--sand)] mb-8">
                                    "{STORY_BEATS.CRISIS.problem}"
                                </p>
                                <div className="font-mono text-xs text-red-600 uppercase tracking-widest">
                                    Logistics failure detected. Wadis are bone dry. 
                                    Stamina depleting at critical rates.
                                </div>
                            </div>
                         </div>
                    )}

                    {room.status === GamePhase.MIRACLE && (
                         <div className="flex-1 flex flex-col p-12 items-center justify-center text-center overflow-hidden">
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-blue-500/5"
                            />
                            <h2 className="text-5xl font-bold uppercase text-blue-400 mb-6 tracking-tighter relative z-10">{STORY_BEATS.MIRACLE.title}</h2>
                            <p className="text-xl text-[var(--sand)]/90 max-w-2xl relative z-10 mb-8">
                                "Yehoram despairs, but Yehoshaphat asks for a prophet of Hashem. Elisha orders trenches to be dug."
                            </p>
                            <div className="grid grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
                                <div className="p-6 border border-blue-500/20 bg-blue-500/10 backdrop-blur-sm">
                                    <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-2">Prophetic Action</div>
                                    <div className="text-sm italic">"Make this wadi full of trenches... Ye shall not see wind, neither shall ye see rain; yet that wadi shall be filled with water."</div>
                                </div>
                                <div className="p-6 border border-[var(--gold)]/20 bg-[var(--gold)]/10 backdrop-blur-sm">
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--gold)] mb-2">The supernatural</div>
                                    <div className="text-sm italic">The water came by the way of Edom in the morning, and the country was filled with water.</div>
                                </div>
                            </div>
                         </div>
                    )}

                    {room.status === GamePhase.VICTORY && (
                         <div className="flex-1 flex flex-col p-12 items-center justify-center text-center">
                            <Trophy className="w-24 h-24 text-[var(--gold)] mb-8 drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]" />
                            <h2 className="text-6xl font-bold uppercase text-[var(--gold)] mb-6 tracking-tighter">{STORY_BEATS.VICTORY.title}</h2>
                            <div className="max-w-2xl space-y-6">
                                <p className="text-2xl text-[var(--sand)]">
                                    "{STORY_BEATS.VICTORY.twist}"
                                </p>
                                <div className="p-6 border border-[#8B0000] bg-[#8B0000]/10">
                                    <h3 className="text-[#8B0000] font-bold uppercase tracking-widest mb-2 font-mono">BATTLE RESOLUTION</h3>
                                    <p className="text-xs uppercase leading-relaxed text-[var(--sand)]/80">
                                        The Moabites saw the water as blood. They charged. The alliance met them with absolute force.
                                        The siege is complete.
                                    </p>
                                </div>
                            </div>
                         </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Player List */}
        <div className="bg-[var(--ink)] p-4 border border-[var(--gold)] h-48 overflow-y-auto">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[10px] uppercase tracking-tighter opacity-50 font-mono">Mobilized Units ({players.length})</h3>
                <div className="flex gap-4">
                    {Object.values(Team).map(team => (
                        <div key={team} className="flex items-center gap-1">
                            <div className={cn("w-2 h-2", 
                                team === Team.YISRAEL ? "bg-blue-500" : 
                                team === Team.YEHUDAH ? "bg-red-800" : "bg-black"
                            )} />
                            <span className="text-[8px] uppercase font-mono text-[var(--sand)]">{players.filter(p => p.team === team).length}</span>
                        </div>
                    ))}
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {players.map(player => (
                    <div key={player.id} className="p-3 border border-[var(--gold)]/10 bg-[var(--gold)]/5 flex flex-col relative group transition-colors hover:border-[var(--gold)]/30">
                        <span className="text-xs text-[var(--sand)] font-bold truncate uppercase">{player.name}</span>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[8px] text-[var(--gold)] uppercase font-mono truncate">{player.team || 'Enlisting...'}</span>
                            <span className="text-[8px] text-[var(--sand)]/40 font-mono">{player.role !== 'UNASSIGNED' ? player.role : ''}</span>
                        </div>
                        <div className={cn("absolute bottom-0 left-0 h-0.5 bg-[var(--gold)]", 
                            player.team === Team.YISRAEL ? "bg-blue-500" : 
                            player.team === Team.YEHUDAH ? "bg-red-800" : 
                            player.team === Team.EDOM ? "bg-black" : "bg-transparent"
                        )} style={{ width: '100%' }} />
                    </div>
                ))}
             </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatBar = ({ label, value, color, icon: Icon }: { label: string, value: number, color: string, icon: any }) => (
  <div>
    <div className="flex justify-between text-[8px] uppercase tracking-widest mb-1 opacity-60 font-mono items-center">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <span>{Math.floor(value)}%</span>
    </div>
    <div className="h-1 bg-[var(--sand)]/5 w-full">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className={cn("h-full", color, "shadow-[0_0_5px_rgba(0,0,0,0.5)]")}
      />
    </div>
  </div>
);
