/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GamePhase, Team, AllianceStrategy } from './types';

export const STORY_BEATS = {
  ALLIANCE: {
    title: "The Coalition Formation",
    description: "King Mesha of Moav has rebelled. King Yehoram of Yisrael gathers an alliance of three kings."
  },
  TREK: {
    title: "The Long March",
    description: "The armies march through the wilderness of Edom..."
  },
  CRISIS: {
    title: "The Logistical Error",
    crisis: "Seven days in the wilderness, and there is no water. The kings are stranded.",
    question: "Why does Elisha mock the King of Yisrael?",
    options: [
      "Because the army is too small",
      "Due to the king's idolatrous lineage (Achav and Izebel)",
      "Because they marched without consulting a map",
      "Because they forgot goatskins"
    ],
    correctIndex: 1,
    learning: "Elisha only helps out of respect for King Yehoshaphat of Yehudah. He demands a musician, and prophecies that water will fill the valley without wind or rain."
  },
  MIRACLE: {
    title: "The Wadi Paradox Resolved",
    description: "Water fills the trenches. But what does the enemy see?"
  },
  AMBUSH: {
    title: "The Visual Deception",
    description: "The morning sun reflects off the water, aided by the red Edomite terrain. Moav sees blood."
  },
  CROSSROADS: {
    title: "The Final Stand",
    description: "The King of Moav, cornered at Kir-Hareseth, sacrifices his firstborn son on the wall. A great wrath comes upon Yisrael."
  }
};

export const COLORS = {
  sand: "#E6D5B8",
  ink: "#1A1A1B",
  gold: "#C5A059",
  bloodRed: "#8B0000",
  waterBlue: "#005C8A",
  desert_bg: "#F4E3C1"
};

export const TEAM_NAMES: Record<Team, string> = {
  [Team.YISRAEL]: "Kingdom of Yisrael",
  [Team.YEHUDAH]: "Kingdom of Yehudah",
  [Team.EDOM]: "Kingdom of Edom"
};

export const STRATEGY_DESCRIPTIONS: Record<AllianceStrategy, { name: string, desc: string, ability: string }> = {
  [AllianceStrategy.CAUTIOUS]: { 
    name: "The Cautious Path", 
    desc: "A meticulous approach favored by Yehudah.", 
    ability: "Prophetic Insight: Prevents complete alliance integrity loss." 
  },
  [AllianceStrategy.AGGRESSIVE]: { 
    name: "The Aggressive Path", 
    desc: "A fast, high-resource approach by Yisrael.", 
    ability: "Rapid Deployment: Moves fast but consumes extra stamina." 
  },
  [AllianceStrategy.SCOUT]: { 
    name: "The Scout Path", 
    desc: "Utilize local knowledge of Edom.", 
    ability: "Fog-of-War Removal: Acts as the team's eyes in the wilderness." 
  },
  [AllianceStrategy.UNASSIGNED]: { name: "Unassigned", desc: "Awaiting strategy.", ability: "None" }
};
