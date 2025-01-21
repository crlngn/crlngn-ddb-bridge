export const SETTING_INPUT = {
  select: "select", 
  checkbox: "checkbox"
}
export const SETTING_SCOPE = {
  client: "client",
  world: "world"
}

export const SETTINGS = {
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

  skipRollConfig: { 
    tag: "skip-roll-config", 
    label: "Skip roll configuration dialog?",
    hint: "Options: (1) skips configuration, but pressing 'shift' while rolling will open dialog; (2) Default behavior for Foundry rolls - press 'shift' to skip dialog. On rolls from D&D Beyond, dialog is never shown.",
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

  forceDDBGL: { 
    tag: "force-ddbgl-settings", 
    label: "Force DDB Gamelog settings",
    hint: "Automatically reset D&D Beyond Gamelog settings to make this module work better. Disabling this setting might disable integration with DDB Gamelog.",
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

}