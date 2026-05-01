/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GamePhase {
  LOBBY = 'LOBBY',
  REBELLION = 'REBELLION', // Phase 1
  CRISIS = 'CRISIS',      // Phase 2
  MIRACLE = 'MIRACLE',    // Phase 3
  VICTORY = 'VICTORY',    // Phase 4
  END = 'END'
}

export enum Team {
  YISRAEL = 'YISRAEL',
  YEHUDAH = 'YEHUDAH',
  EDOM = 'EDOM'
}

export enum PlayerRole {
  SCOUT = 'SCOUT',
  WATER_BEARER = 'WATER_BEARER',
  TACTICIAN = 'TACTICIAN',
  UNASSIGNED = 'UNASSIGNED'
}

export interface Player {
  id: string;
  name: string;
  team: Team | null;
  role: PlayerRole;
  isHost: boolean;
  score: number;
}

export interface GameState {
  stamina: number; // 0-100
  water: number;   // 0-100
  morale: number;  // 0-100
  currentPhase: GamePhase;
  phaseStartTime: number | null;
  allianceBuilt: boolean;
  crisisSolved: boolean;
  miracleTriggered: boolean;
  victoryAchieved: boolean;
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
