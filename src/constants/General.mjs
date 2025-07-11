export const MODULE_ID = "crlngn-ddb-bridge";
export const MODULE_TITLE = "DDB Gamelog Bridge";
export const MODULE_SHORT = "crlngn-ddb-bridge";
export const DEBUG_TAG = [
  `%cDDB Gamelog Bridge`,
  `color: #003377; font-weight: bold;`,
  `|`,
];

export const ACTIVITY_TYPES = {
  attack: 'attack'
}

export const ROLL_TYPES = {
  abilityCheck: "ability",
  abilitySave: "save",
  attack: "attack",
  check: "check",
  concentration: "concentration",
  damage: "damage",
  deathSave: "death",
  formula: "formula",
  healing: "heal",
  custom: "roll",
  skillCheck: "skill",
  toolCheck: "tool"
}

export const CHAR_ABILITIES = [
  { abbrev: "str", name: "strength" },
  { abbrev: "dex", name: "dexterity" },
  { abbrev: "con", name: "constitution" },
  { abbrev: "int", name: "intelligence" },
  { abbrev: "wis", name: "wisdom" },
  { abbrev: "cha", name: "charisma" }
]

export const CLASS_PREFIX = 'crlngn';