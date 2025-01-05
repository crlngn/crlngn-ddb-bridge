import { MODULE_ID } from "../constants/General.mjs";

export class SettingsUtil {
    /**
     * Registers settings for this module
     */
    static registerSettings(){
      // LogUtil.log will only output messages if this is set to true
      game.settings.register(MODULE_ID, "debug-mode", {
        name: "Debug Mode",
        hint: "Turn on debug messages on browser inspector",
        default: false,
        type: Boolean,
        scope: "client",
        config: true
      });
    }

    /**
     * Retrieve the value of a setting for this module
     * @param {String} settingName 
     * @param {String} moduleName 
     * @returns {*} // current value of the setting
     */
    static get(settingName, moduleName=MODULE_ID){
      if(!settingName){ return null; }
      const value = game.settings.get(moduleName, settingName);

      return value;
    }
}

