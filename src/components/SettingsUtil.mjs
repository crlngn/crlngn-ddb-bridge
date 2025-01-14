import { MODULE_ID } from "../constants/General.mjs";
import { HOOKS_CORE } from "../constants/Hooks.mjs";
import { GeneralUtil } from "./GeneralUtil.mjs";
import { LogUtil } from "./LogUtil.mjs";

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
      game.settings.register(MODULE_ID, "set-ddbgl-settings", {
        name: "Force DDB Gamelog settings",
        hint: "Automatically reset D&D Beyond Gamelog settings to make this module work correctly. Warning: changing this setting might disable integration with DDB Gamelog.",
        default: true,
        type: Boolean,
        scope: "world",
        config: true
      });

      LogUtil.log("registerSettings", [game.settings]);
    }

    /**
     * Retrieve the value of a setting for this module
     * @param {String} settingName 
     * @param {String} moduleName 
     * @returns {*} // current value of the setting
     */
    static get(settingName, moduleName=MODULE_ID){
      if(!settingName){ return null; }
      let selectedSetting = game.settings.storage.get("client")[`${moduleName}.${settingName}`];
      //
      if(!selectedSetting){
        const world = game.settings.storage.get("world");
        selectedSetting = world.getSetting(`${moduleName}.${settingName}`);
      }
      const value = selectedSetting?.value;
      
      return value;
    }
    /**
     * Retrieve the value of a setting for this module
     * @param {String} settingName 
     * @param {String} moduleName 
     * @returns {*} // current value of the setting
     */
    static set(settingName, newValue, moduleName=MODULE_ID){ 
      if(!settingName){ return false; }
      let selectedSetting = game.settings.storage.get("client")[`${moduleName}.${settingName}`];

      if(!selectedSetting){
        const world = game.settings.storage.get("world");
        selectedSetting = world.getSetting(`${moduleName}.${settingName}`);
      } 

      try{
        if(selectedSetting){
          selectedSetting.update({value: newValue});
        }
        LogUtil.log("Able to change setting",[settingName, selectedSetting]);
      }catch(e){
        LogUtil.log("Unable to change setting",[settingName, selectedSetting]);
      }
      // const value = game.settings.get(moduleName, settingName);

      return true;
    }

    static resetGamelogSettings(){
      const isDDBGLOn = GeneralUtil.isModuleOn("ddb-game-log");
      if(!isDDBGLOn){ return; }

      const itemDescriptionsOn = SettingsUtil.get("enable_chatcards", "ddb-game-log");
      const forceSettingsOn = SettingsUtil.get("set-ddbgl-settings");

      LogUtil.log("resetGamelogSettings", [itemDescriptionsOn, forceSettingsOn])

      if(!itemDescriptionsOn && forceSettingsOn){
        SettingsUtil.set("enable_chatcards", true, "ddb-game-log");
      }
    }
}

