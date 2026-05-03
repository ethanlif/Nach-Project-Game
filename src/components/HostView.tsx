/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { Users, Play, LogOut, Shield, Map as MapIcon, Droplets, Sparkles, Trophy, Sword, AlertTriangle, ArrowRight } from 'lucide-react';
import { gameService } from '../services/gameService';
import { Room, GamePhase, Player, Team, EndState, GameState } from '../types';
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
      
      // Automatic resource drain and day progression during Trek
      if (room.status === GamePhase.TREK) {
         let currentDistance = room.gameState.distance || 0;
         let newDayMark = Math.floor(currentDistance / 10); // Every 10 distance = 1 day (70 distance = 7 days)
         let shouldUpdate = false;
         let updates: Partial<GameState> = {};

         if (newDayMark !== room.gameState.dayMark && newDayMark <= 7) {
             updates.dayMark = newDayMark;
             shouldUpdate = true;
         }

         if (newDayMark >= 7) {
             // Hard Lock
             gameService.setGamePhase(room.id, GamePhase.CRISIS);
             return;
         }

         // Passive drain
         if (ticker % 2 === 0 && room.gameState.water > 0) {
             updates.water = Math.max(0, room.gameState.water - 0.2);
             updates.stamina = Math.max(0, room.gameState.stamina - 0.1);
             shouldUpdate = true;
         }

         if (shouldUpdate) {
             gameService.updateGameState(room.id, updates);
         }
      }
      
      // Auto transition Miracle -> Ambush after 8 seconds
      if (room.status === GamePhase.MIRACLE) {
          const startTime = room.gameState.phaseStartTime || Date.now();
          const elapsed = Date.now() - startTime;
          if (elapsed > 8000) {
              gameService.setGamePhase(room.id, GamePhase.AMBUSH);
          }
      }

      // Handle Ambush Window timeout (10 seconds)
      if (room.status === GamePhase.AMBUSH) {
          const startTime = room.gameState.phaseStartTime || Date.now();
          const elapsed = Date.now() - startTime;
          if (elapsed > 10000) { // 10 seconds
              const requiredTaps = players.length > 0 ? players.length * 10 : 10;
              const success = room.gameState.ambushTaps >= requiredTaps;
              gameService.updateGameState(room.id, { ambushSuccess: success });
              if (!success) {
                  // Take casualty damage
                  gameService.updateGameState(room.id, { 
                      stamina: Math.max(0, room.gameState.stamina - 30),
                      allianceIntegrity: Math.max(0, room.gameState.allianceIntegrity - 20)
                  });
              }
              // Move to moral crossroads
              gameService.setGamePhase(room.id, GamePhase.CROSSROADS);
          }
      }

      // Handle Crossroads Auto Conclusion
      if (room.status === GamePhase.CROSSROADS) {
          const totalVotes = (room.gameState.votesEradicate || 0) + (room.gameState.votesWithdraw || 0);
          if (totalVotes > 0 && totalVotes >= players.length) {
              const endState = room.gameState.votesWithdraw >= room.gameState.votesEradicate ? EndState.TRUE : EndState.BAD;
              gameService.updateGameState(room.id, { endState });
              gameService.setGamePhase(room.id, GamePhase.END);
          }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room, ticker]);

  // Endings monitor
  useEffect(() => {
     if (room && room.gameState.stamina <= 0 && room.status !== GamePhase.END && room.status !== GamePhase.LOBBY) {
         gameService.updateGameState(room.id, { endState: EndState.DESOLATION });
         gameService.setGamePhase(room.id, GamePhase.END);
     }
  }, [room?.gameState.stamina, room?.status, room?.id]);

  const handleStartGame = async () => {
    if (roomId && players.length >= 1) {
      await gameService.assignTeams(roomId, players);
      await gameService.setGamePhase(roomId, GamePhase.ALLIANCE);
    }
  };

  const handleNextPhase = async () => {
    if (!room) return;
    const phases = [
      GamePhase.LOBBY,
      GamePhase.ALLIANCE,
      GamePhase.TREK,
      GamePhase.CRISIS,
      GamePhase.MIRACLE,
      GamePhase.AMBUSH,
      GamePhase.CROSSROADS,
      GamePhase.END
    ];
    const currentIndex = phases.indexOf(room.status);
    if (currentIndex < phases.length - 1) {
      await gameService.setGamePhase(room.id, phases[currentIndex + 1]);
    }
  };

  const calculateOutcome = () => {
    if (!room) return;
    if (room.gameState.votesWithdraw > room.gameState.votesEradicate) {
      gameService.updateGameState(room.id, { endState: EndState.TRUE });
      gameService.setGamePhase(room.id, GamePhase.END);
    } else {
      gameService.updateGameState(room.id, { endState: EndState.BAD });
      gameService.setGamePhase(room.id, GamePhase.END);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="font-mono animate-pulse uppercase tracking-widest text-[#C5A059]">Inaugurating Unified Command...</div>
      </div>
    );
  }

  if (!room) return null;

  const trekProgress = room.status === GamePhase.TREK ? Math.min(100, ((room.gameState.distance || 0) / 70) * 100) : (room.status === GamePhase.END || room.status === GamePhase.CROSSROADS || room.status === GamePhase.AMBUSH || room.status === GamePhase.MIRACLE || room.status === GamePhase.CRISIS ? 100 : 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 pt-24 min-h-screen grid grid-cols-12 gap-8 relative"
    >
      <MoabiteThreat intensity={room.status === GamePhase.AMBUSH ? 80 : (ticker % 30) * 3} />

      {/* Left Panel: Status & Controls */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 relative z-10">
        <div className="bg-[var(--ink)] text-[var(--sand)] p-6 border border-[var(--gold)] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--gold)]/10 -mr-8 -mt-8 rotate-45" />

          <div className="flex items-center gap-2 mb-6 opacity-60">
            <Shield className="w-4 h-4" />
            <span className="text-[8px] uppercase tracking-widest font-mono">Unified Command</span>
          </div>

          <div className="mb-8">
            <h1 className="text-5xl font-bold font-mono tracking-tighter mb-2 text-[var(--gold)]">{room.code}</h1>
            <p className="text-[8px] uppercase tracking-[0.4em] opacity-40">Entry Permissions</p>
          </div>

          {room.status === GamePhase.LOBBY && (
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
          )}

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
            ) : room.status === GamePhase.CROSSROADS ? (
              <button 
                onClick={calculateOutcome}
                className="w-full bg-blue-500 text-white py-4 font-bold uppercase tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Finalize Vote
              </button>
            ) : (
              <button 
                onClick={handleNextPhase}
                disabled={room.status === GamePhase.END}
                className="w-full bg-[var(--gold)]/20 border border-[var(--gold)] text-[var(--gold)] py-4 font-bold uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--ink)] flex items-center justify-center gap-2 disabled:opacity-20 transition-colors"
              >
                Next Phase <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button 
              onClick={onBack}
              className="w-full border border-[var(--gold)]/30 text-[var(--gold)] py-3 text-xs font-bold uppercase tracking-widest hover:bg-[var(--gold)]/10 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3 h-3" />
              Abandon Session
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="bg-[var(--ink)] text-[var(--sand)] p-6 border border-[var(--gold)] shadow-xl relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] uppercase tracking-tighter opacity-50 font-mono">Tactical Vitals</h3>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="space-y-5">
            <StatBar label="Stamina" value={room.gameState.stamina} color="bg-[var(--gold)]" icon={MapIcon} />
            <StatBar label="Water Supply" value={room.gameState.water} color="bg-blue-500" icon={Droplets} />
            <StatBar label="Alliance Integrity" value={room.gameState.allianceIntegrity} color="bg-green-600" icon={Shield} />
            
            <div className="pt-4 border-t border-[var(--gold)]/20">
                <div className="flex justify-between items-center text-[10px] font-mono text-[var(--gold)] uppercase tracking-widest">
                    <span>Expedition Day</span>
                    <span>{room.gameState.dayMark || 0} / 7</span>
                </div>
            </div>
          </div>
        </div>

        {/* Game Master Overrides */}
        <div className="bg-[var(--ink)] text-[var(--sand)] p-6 border border-red-500/50 shadow-xl relative z-10">
          <h3 className="text-[10px] uppercase tracking-widest font-mono text-red-500 mb-4 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> Overrides</h3>
          <div className="flex flex-col gap-2 mb-4">
               <button 
                  onClick={() => {
                      gameService.updateGameState(room.id, { crisisResolved: true, water: 100 });
                      gameService.setGamePhase(room.id, GamePhase.MIRACLE);
                  }}
                  className="text-[8px] font-mono border border-blue-500 p-2 hover:bg-blue-900/30 text-blue-400 uppercase tracking-widest"
                >
                 Push "Prophetic Guidance" (Solve Wadi Paradox)
               </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-500/20">
            {[GamePhase.TREK, GamePhase.CRISIS, GamePhase.MIRACLE, GamePhase.AMBUSH, GamePhase.CROSSROADS, GamePhase.END].map((p) => (
               <button 
                  key={p}  
                  onClick={() => gameService.setGamePhase(room.id, p)}
                  className="text-[8px] font-mono border border-red-500/30 p-2 hover:bg-red-500/20 text-red-400 uppercase tracking-widest disabled:opacity-30"
                  disabled={room.status === p}
                >
                 Force {p}
               </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Map & Players */}
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 relative z-10">
        {/* Game Phase View */}
        <div className="flex-1 bg-[var(--ink)] border border-[var(--gold)] relative overflow-hidden flex flex-col pt-8">
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

                    {room.status === GamePhase.ALLIANCE && (
                         <div className="flex-1 flex flex-col p-12 items-center text-center">
                            <Shield className="w-20 h-20 text-[var(--gold)] mb-6" />
                            <h2 className="text-4xl font-bold uppercase text-[var(--gold)] mb-4 tracking-tighter">{STORY_BEATS.ALLIANCE.title}</h2>
                            <p className="text-[var(--sand)]/80 text-xl max-w-2xl">{STORY_BEATS.ALLIANCE.description}</p>
                            <div className="mt-12 text-[var(--gold)] font-mono uppercase tracking-widest text-sm animate-pulse">
                              Awaiting teams to lock in Alliance Strategies on their devices...
                            </div>
                         </div>
                    )}

                    {(room.status === GamePhase.TREK || room.status === GamePhase.CRISIS || room.status === GamePhase.MIRACLE || room.status === GamePhase.AMBUSH || room.status === GamePhase.CROSSROADS) && (
                         <div className="flex-1 flex flex-col p-8 relative">
                            {/* Header Info */}
                            <div className="mb-4 flex items-center justify-between relative z-20">
                                <div>
                                    <h2 className={cn(
                                        "text-2xl font-bold uppercase tracking-tighter transition-colors duration-1000",
                                        room.status === GamePhase.CRISIS ? "text-red-500" :
                                        room.status === GamePhase.MIRACLE ? "text-blue-300" :
                                        room.status === GamePhase.AMBUSH ? "text-red-500" :
                                        "text-[var(--gold)]"
                                    )}>
                                        {room.status === GamePhase.CRISIS ? STORY_BEATS.CRISIS.title :
                                         room.status === GamePhase.MIRACLE ? STORY_BEATS.MIRACLE.title : 
                                         room.status === GamePhase.AMBUSH ? "AMBUSH INITIATED" : 
                                         room.status === GamePhase.CROSSROADS ? "MORAL CROSSROADS" : 
                                         STORY_BEATS.TREK.title}
                                    </h2>
                                    <p className="text-[var(--sand)]/80 text-xs uppercase font-mono max-w-md">
                                        {room.status === GamePhase.CRISIS ? STORY_BEATS.CRISIS.crisis :
                                         room.status === GamePhase.MIRACLE ? STORY_BEATS.MIRACLE.description : 
                                         room.status === GamePhase.AMBUSH ? "Strike team charging..." : 
                                         room.status === GamePhase.CROSSROADS ? "Total Eradication vs Moral Withdrawal" : 
                                         STORY_BEATS.TREK.description}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase text-[var(--gold)] opacity-50 mb-1">Fleet Progress</div>
                                    <div className="text-xl font-mono text-[var(--sand)]">{Math.floor(trekProgress)}%</div>
                                </div>
                            </div>
                            
                            <div className="flex-1 border border-[var(--gold)]/20 relative rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <DesertMap progress={trekProgress} phase={room.status} crisisResolved={room.gameState.crisisResolved} />
                                
                                {/* Overlay UI per phase */}
                                <AnimatePresence>
                                    {room.status === GamePhase.CRISIS && !room.gameState.crisisResolved && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-black/80 backdrop-blur-md p-6 border border-red-600/50 text-center"
                                        >
                                           <AlertTriangle className="w-12 h-12 text-red-600 mb-4 mx-auto animate-pulse" />
                                           <div className="font-mono text-sm text-red-500 uppercase tracking-widest border-l-4 border-red-500 text-left pl-4">
                                               HARD LOCK INITIATED. WADIS DRY. ALLIANCE STALLED.<br/><br/>
                                               Consultation pending on distributed units. Wait.
                                           </div>
                                        </motion.div>
                                    )}

                                    {room.status === GamePhase.MIRACLE && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl text-center bg-blue-900/40 backdrop-blur-md p-4 border border-blue-500/50"
                                        >
                                            <div className="font-mono text-blue-300 text-sm uppercase tracking-widest">
                                               "And the country was filled with water."<br/>
                                               Standby for enemy perception shift.
                                            </div>
                                        </motion.div>
                                    )}

                                    {room.status === GamePhase.AMBUSH && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center"
                                        >
                                            <div className="mb-4 bg-black/90 backdrop-blur-md border border-red-500/50 p-6 shadow-[0_0_30px_rgba(255,0,0,0.3)]">
                                                <h3 className="text-xl font-bold text-red-500 uppercase tracking-[0.2em] mb-4">Ambush Synergy Window</h3>
                                                <div className="w-full h-8 bg-white/5 border border-red-500/30 relative overflow-hidden">
                                                    <motion.div 
                                                        className="absolute inset-y-0 left-0 bg-red-600 shadow-[0_0_15px_rgba(255,0,0,0.8)]"
                                                        style={{ width: `${Math.min(100, ((room.gameState.ambushTaps || 0) / 100) * 100)}%` }} // 100 taps total
                                                        transition={{ ease: "circOut" }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center mix-blend-difference">
                                                        <span className="font-mono text-sm text-white font-bold">{room.gameState.ambushTaps || 0} / 100 Sync Levels</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {room.status === GamePhase.CROSSROADS && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl text-center"
                                        >
                                           <div className="grid grid-cols-2 gap-4">
                                              <div className="bg-[#8B0000]/80 backdrop-blur-md border border-[#8B0000] p-6 text-white text-left shadow-[0_0_20px_rgba(139,0,0,0.5)]">
                                                  <h3 className="text-xl font-bold uppercase mb-2">Eradicate</h3>
                                                  <div className="text-4xl font-mono mb-2">{room.gameState.votesEradicate} Votes</div>
                                                  <div className="text-[10px] opacity-70 uppercase tracking-widest font-mono">Annihilate Kir-Hareseth</div>
                                              </div>
                                              <div className="bg-blue-900/80 backdrop-blur-md border border-blue-500 p-6 text-white text-right shadow-[0_0_20px_rgba(0,100,255,0.3)]">
                                                  <h3 className="text-xl font-bold uppercase mb-2">Withdraw</h3>
                                                  <div className="text-4xl font-mono mb-2">{room.gameState.votesWithdraw} Votes</div>
                                                  <div className="text-[10px] opacity-70 uppercase tracking-widest font-mono">Cease fire. Retreat from Moav</div>
                                              </div>
                                           </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                         </div>
                    )}

                    {room.status === GamePhase.END && (
                         <div className="flex-1 flex flex-col p-12 items-center justify-center text-center">
                            <Trophy className="w-24 h-24 text-[var(--gold)] mb-8" />
                            <h2 className="text-6xl font-bold uppercase text-[var(--gold)] mb-6 tracking-tighter">
                              {room.gameState.endState === EndState.TRUE ? "PROPHETIC BLESSING" : 
                               room.gameState.endState === EndState.BAD ? "TACTICAL VICTORY, MORAL DEFEAT" : "DESOLATION"}
                            </h2>
                            <p className="text-xl text-[var(--sand)]/80 max-w-2xl border-t border-[var(--gold)]/20 pt-6">
                              {room.gameState.endState === EndState.TRUE ? "You recognized the horror of the scene and chose to cease fire, showing proper humility and restraint. The lesson of trust over arrogance is fulfilled." : 
                               room.gameState.endState === EndState.BAD ? "The armies pressed the advantage, ignoring the human cost. The narrative ticker details the total loss of the kings' humanity, descending into the savage ways of those they fought." : 
                               (room.gameState.crisisResolved ? "The armies were destroyed in combat. They faltered in their unity and were overrun." : "They relied on their own swords and found only the dust of the wilderness. The miracle was never reached.")}
                            </p>
                         </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Player List */}
        <div className="bg-[var(--ink)] p-4 border border-[var(--gold)] h-64 overflow-y-auto relative z-10 shadow-xl scrollbar-thin scrollbar-thumb-[var(--gold)]/30 scrollbar-track-transparent">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[10px] uppercase tracking-tighter opacity-50 font-mono">Mobilized Units ({players.length})</h3>
                <div className="flex gap-4">
                    {Object.values(Team).map(team => (
                        <div key={team} className="flex items-center gap-1">
                            <div className={cn("w-2 h-2 rounded-full", 
                                team === Team.YISRAEL ? "bg-blue-500" : 
                                team === Team.YEHUDAH ? "bg-red-800" : "bg-black"
                            )} />
                            <span className="text-[8px] uppercase font-mono text-[var(--sand)]">{players.filter(p => p.team === team).length}</span>
                        </div>
                    ))}
                </div>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {players.map(player => (
                    <div key={player.id} className="p-2 border border-[var(--gold)]/10 bg-[var(--gold)]/5 flex flex-col relative group transition-all hover:border-[var(--gold)]/50 hover:bg-[var(--gold)]/10">
                        <span className="text-[9px] text-[var(--sand)] font-bold truncate uppercase">{player.name}</span>
                        <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[7px] text-[var(--gold)] uppercase font-mono truncate">{player.team ? (TEAM_NAMES[player.team]?.substring(0, 3)) : '...'}</span>
                            <span className="text-[7px] text-[var(--sand)]/40 font-mono text-right truncate pl-1">{player.strategy !== 'UNASSIGNED' ? player.strategy.substring(0, 4) : ''}</span>
                        </div>
                        <div className={cn("absolute bottom-0 left-0 h-0.5 w-full", 
                            player.team === Team.YISRAEL ? "bg-blue-500" : 
                            player.team === Team.YEHUDAH ? "bg-red-800" : 
                            player.team === Team.EDOM ? "bg-stone-600" : "bg-transparent"
                        )} />
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
