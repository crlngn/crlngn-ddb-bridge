export const SETTING_INPUT = {
  select: "select", 
  checkbox: "checkbox"
}
export const SETTING_SCOPE = {
  client: "client",
  world: "world"
}

export function getSettings() { 
  return {
    enableChatStyles: { 
      tag: "enable-chat-styles", 
      label: game.i18n.localize("CRLNGN.settings.enableChatStyles.label"), 
      hint: game.i18n.localize("CRLNGN.settings.enableChatStyles.hint"), 
      propType: Boolean, 
      inputType: SETTING_INPUT.checkbox, 
      default: true, 
      scope: SETTING_SCOPE.client, 
      config: true, 
      requiresReload: true 
    }, 

    ddbRollOwnership: { 
      tag: "ddb-roll-ownership", 
      label: game.i18n.localize("CRLNGN.settings.ddbRollOwnership.label"),
      hint: game.i18n.localize("CRLNGN.settings.ddbRollOwnership.hint"),
      propType: Number,
      choices: {
        1: game.i18n.localize("CRLNGN.settings.ddbRollOwnership.choices.gm.label"), 
        2: game.i18n.localize("CRLNGN.settings.ddbRollOwnership.choices.player.label")
      },
      inputType: SETTING_INPUT.select,
      default: 2,
      scope: SETTING_SCOPE.world,
      config: true
    },

    foundryRollModifiers: {
      tag: "foundry-roll-modifiers", 
      label: game.i18n.localize("CRLNGN.settings.foundryRollModifiers.label"),
      hint: game.i18n.localize("CRLNGN.settings.foundryRollModifiers.hint"),
      propType: Boolean,
      inputType: SETTING_INPUT.checkbox,
      default: true,
      scope: SETTING_SCOPE.world,
      config: true
    },

    forceDDBGL: { 
      tag: "force-ddbgl-settings", 
      label: game.i18n.localize("CRLNGN.settings.forceDDBGL.label"),
      hint: game.i18n.localize("CRLNGN.settings.forceDDBGL.hint"),
      propType: Boolean,
      inputType: SETTING_INPUT.checkbox,
      default: true,
      scope: SETTING_SCOPE.world,
      config: true
    },

    removeTemplate: { 
      tag: "remove-template", 
      label: game.i18n.localize("CRLNGN.settings.removeTemplate.label"),
      hint: game.i18n.localize("CRLNGN.settings.removeTemplate.hint"),
      propType: Boolean,
      inputType: SETTING_INPUT.checkbox,
      default: true,
      scope: SETTING_SCOPE.world,
      config: true
    }, 

    templateAutoTarget: { 
      tag: "template-auto-target", 
      label: game.i18n.localize("CRLNGN.settings.templateAutoTarget.label"),
      hint: game.i18n.localize("CRLNGN.settings.templateAutoTarget.hint"),
      propType: Number,
      choices: {
        1: game.i18n.localize("CRLNGN.settings.templateAutoTarget.choices.all.label"),
        2: game.i18n.localize("CRLNGN.settings.templateAutoTarget.choices.notFriendly.label"),
        3: game.i18n.localize("CRLNGN.settings.templateAutoTarget.choices.none.label"),
      },
      inputType: SETTING_INPUT.checkbox,
      default: true,
      scope: SETTING_SCOPE.world,
      config: true
    },

    skipRollConfig: { 
      tag: "skip-roll-config", 
      label: game.i18n.localize("CRLNGN.settings.skipRollConfig.label"),
      hint: game.i18n.localize("CRLNGN.settings.skipRollConfig.hint"),
      propType: Number,
      choices: {
        1: game.i18n.localize("CRLNGN.settings.skipRollConfig.choices.all.label"),
        2: game.i18n.localize("CRLNGN.settings.skipRollConfig.choices.ddbgl.label")
      },
      inputType: SETTING_INPUT.select,
      default: 1,
      scope: SETTING_SCOPE.world,
      config: true
    },

    debugMode: { 
      tag: "debug-mode", 
      label: game.i18n.localize("CRLNGN.settings.debugMode.label"),
      hint: game.i18n.localize("CRLNGN.settings.debugMode.hint"),
      propType: Boolean,
      inputType: SETTING_INPUT.checkbox,
      default: true,
      scope: SETTING_SCOPE.client,
      config: true
    },
  }
}