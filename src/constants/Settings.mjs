export const SETTING_INPUT = {
  select: "select", 
  checkbox: "checkbox"
}
export const SETTING_SCOPE = {
  client: "client",
  world: "world"
}

export const SETTINGS = {
  enableChatStyles: { 
    tag: "enable-chat-styles", 
    label: "Enable styles for chat messages", 
    hint: "Adds styles to chat cards. When dark mode is selected on Foundry or DDB Gamelog, makes all chat cards dark as well. If you use my module Carolingian UI, you can disable this - both modules have dark mode for chat cards.", 
    propType: Boolean, 
    inputType: SETTING_INPUT.checkbox, 
    default: true, 
    scope: SETTING_SCOPE.client, 
    config: true, 
    requiresReload: true 
  }, 

  ddbRollOwnership: { 
    tag: "ddb-roll-ownership", 
    label: "Roll Ownership",
    hint: "If you select Game master, the GM will be prompted to place templates for spells when needed. Option 2 will look for the user this actor is assigned to - if there is none, it will look for any user with 'owner' permission. Defaults to GM if no player is found.",
    propType: Number,
    choices: {
      1: "Game master", 
      2: "Player who owns character"
    },
    inputType: SETTING_INPUT.select,
    default: 2,
    scope: SETTING_SCOPE.world,
    config: true
  },

  forceDDBGL: { 
    tag: "force-ddbgl-settings", 
    label: "Force DDB Gamelog settings",
    hint: "Automatically reset certain D&D Beyond Gamelog settings to make this module work better. Disabling this setting might disable integration with DDB Gamelog.",
    propType: Boolean,
    inputType: SETTING_INPUT.checkbox,
    default: true,
    scope: SETTING_SCOPE.world,
    config: true
  },

  removeTemplate: { 
    tag: "remove-template", 
    label: "Remove Template after damage roll",
    hint: "When a spell has a template, remove the template after damage is rolled. This will only affect DDB Gamelog rolls. If the template has no damage roll, it is not removed.",
    propType: Boolean,
    inputType: SETTING_INPUT.checkbox,
    default: true,
    scope: SETTING_SCOPE.world,
    config: true
  }, 

  // templateAutoTarget: { 
  //   tag: "template-auto-target", 
  //   label: "Auto target tokens on template draw?",
  //   hint: "When the template is drawn on canvas, should tokens be automatically targeted? This affects rolls from DDB Gamelog and Foundry",
  //   propType: Boolean,
  //   inputType: SETTING_INPUT.checkbox,
  //   default: true,
  //   scope: SETTING_SCOPE.world,
  //   config: true
  // },
  
  templateAutoTarget: { 
    tag: "template-auto-target", 
    label: "Template Auto Targeting",
    hint: "When the template is drawn on canvas, should tokens be automatically targeted? This affects rolls from DDB Gamelog and Foundry",
    propType: Number,
    choices: {
      1: "1: Target all tokens",
      2: "2: Target non-friendly",
      3: "3: Do NOT auto target",
    },
    inputType: SETTING_INPUT.checkbox,
    default: true,
    scope: SETTING_SCOPE.world,
    config: true
  },

  skipRollConfig: { 
    tag: "skip-roll-config", 
    label: "Skip roll config dialog?",
    hint: "Options: (1) skips configuration, but pressing 'shift' while rolling will still open dialog; (2) Default behavior for Foundry rolls - press 'shift' to skip dialog. On rolls from D&D Beyond, dialog is never shown.",
    propType: Number,
    choices: {
      1: "1: Skip for all rolls",
      2: "2: Skip for DDB Gamelog rolls"
    },
    inputType: SETTING_INPUT.select,
    default: 1,
    scope: SETTING_SCOPE.world,
    config: true
  },

  debugMode: { 
    tag: "debug-mode", 
    label: "Debug Mode",
    hint: "Enable or disable debug messages on browser console",
    propType: Boolean,
    inputType: SETTING_INPUT.checkbox,
    default: true,
    scope: SETTING_SCOPE.client,
    config: true
  },

}