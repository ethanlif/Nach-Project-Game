/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GamePhase {
  LOBBY = 'LOBBY',
  ALLIANCE = 'ALLIANCE',     // Phase 1: Strategy Loadouts
  TREK = 'TREK',             // Phase 2a: Map movement & Resource drain
  CRISIS = 'CRISIS',         // Phase 2b: Logistical Error / Wadi Paradox
  MIRACLE = 'MIRACLE',       // Phase 3a: Palette Shift
  AMBUSH = 'AMBUSH',         // Phase 3b: Deception / Combat
  CROSSROADS = 'CROSSROADS', // Phase 4: Moral Choice
  END = 'END'                // Bad ending, True ending, Desolation ending
}

export enum EndState {
  NONE = 'NONE',
  DESOLATION = 'DESOLATION', // Failed to consult prophet
  BAD = 'BAD',               // Tactical victory, Moral defeat
  TRUE = 'TRUE'              // Tactical victory, Moral withdrawal
}

export enum Team {
  YISRAEL = 'YISRAEL',
  YEHUDAH = 'YEHUDAH',
  EDOM = 'EDOM'
}

export enum AllianceStrategy {
  CAUTIOUS = 'CAUTIOUS',     // Yehudah
  AGGRESSIVE = 'AGGRESSIVE', // Yisrael
  SCOUT = 'SCOUT',           // Edom
  UNASSIGNED = 'UNASSIGNED'
}

export interface Player {
  id: string;
  name: string;
  team: Team | null;
  strategy: AllianceStrategy;
  isHost: boolean;
  score: number;
}

export interface GameState {
  stamina: number;           // 0-100
  water: number;             // 0-100
  allianceIntegrity: number; // 0-100 Shared meter
  currentPhase: GamePhase;
  phaseStartTime: number | null;
  
  // Phase 1 Tracking
  strategiesLocked: { [key in Team]?: boolean };
  
  // Phase 2 Tracking
  crisisResolved: boolean;
  
  // Phase 3 Tracking
  ambushTaps: number;
  ambushSuccess: boolean | null;
  
  // Phase 4 Tracking
  votesEradicate: number;
  votesWithdraw: number;
  endState: EndState;

  lastAction: string | null;
}

export interface Room {
  id: string;
  code: string;
  status: GamePhase;
  hostId: string;
  gameState: GameState;
  playersCount: number;
  teams: {
    [key in Team]: string[]; // player IDs
  };
}
