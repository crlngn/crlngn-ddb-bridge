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

}