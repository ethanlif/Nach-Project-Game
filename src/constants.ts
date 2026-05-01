/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GamePhase, Team, PlayerRole } from './types';

export const STORY_BEATS = {
  REBELLION: {
    title: "The Rebellion of Mesha",
    conflict: "King Mesha of Moav has stopped the sheep tax (100,000 lambs and 100,000 rams with wool). King Yehoram of Yisrael gathers an alliance.",
    question: "Why did the kings form an alliance?",
    options: [
      "To share the wealth of Moav",
      "Because they shared a common enemy and route",
      "Because Elisha told them to",
      "To conquer the mountains of Edom"
    ],
    correctIndex: 1,
    learning: "The alliance was strategic, involving Yisrael, Yehudah, and the King of Edom, taking the long way through the wilderness of Edom."
  },
  CRISIS: {
    title: "Seven Days in the Wilderness",
    problem: "The armies have marched for seven days and there is no water for the camp or the animals.",
    question: "Rabbi Alex Israel’s commentary: why was this a 'Logistical Error'?",
    options: [
      "They forgot to pack enough goatskins",
      "They got lost in a sandstorm",
      "A wadi they relied on was likely blocked or dry",
      "The King of Edom betrayed them"
    ],
    correctIndex: 2,
    learning: "A wadi is a dry riverbed that fills during flash floods. The kings expected water, but found none."
  },
  MIRACLE: {
    title: "The Hand of the Prophet",
    tension: "Yehoram despairs, but Yehoshaphat asks for a prophet of Hashem. They find Elisha ben Shafat.",
    question: "Why was Elisha reluctant to help the King of Yisrael?",
    options: [
      "He wanted more gold",
      "Because of theKing's wicked behavior and his parents' prophets (Achav and Izebel)",
      "He didn't know the way to Moav",
      "He was busy with other miracles"
    ],
    correctIndex: 1,
    learning: "Elisha only helped out of respect for King Yehoshaphat of Yehudah."
  },
  VICTORY: {
    title: "Red Water of Moav",
    twist: "In the morning, without rain, the trenches filled with water. To the Moabites, it looked like blood.",
    action: "CHARGE THE MOABITE CAMP!",
    resolution: "The alliance defeats Moav, destroys their cities, and stops their wells. The King of Moav makes a desperate sacrifice on the wall."
  }
};

export const COLORS = {
  sand: "#E6D5B8",
  ink: "#1A1A1B",
  gold: "#C5A059",
  red: "#8B0000",
  desert_bg: "#F4E3C1",
  accent: "#D4AF37"
};

export const TEAM_NAMES: Record<Team, string> = {
  [Team.YISRAEL]: "Kingdom of Yisrael",
  [Team.YEHUDAH]: "Kingdom of Yehudah",
  [Team.EDOM]: "Kingdom of Edom"
};

export const ROLE_DESCRIPTIONS: Record<PlayerRole, string> = {
  [PlayerRole.SCOUT]: "Finds hidden paths and resources.",
  [PlayerRole.WATER_BEARER]: "Manages and preserves water supply.",
  [PlayerRole.TACTICIAN]: "Coordinates the team in battle.",
  [PlayerRole.UNASSIGNED]: "Waiting for role selection..."
};
