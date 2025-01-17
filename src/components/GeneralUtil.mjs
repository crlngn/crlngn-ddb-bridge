import { CHAR_ABILITIES } from "../constants/General.mjs";
import { LogUtil } from "./LogUtil.mjs";
import { SettingsUtil } from "./SettingsUtil.mjs";

export class GeneralUtil {
  /**
   * Identifies the current selected or targeted tokens
   * @param {User5e} user
   * @returns {Set} A set of targeted tokens
   */
  static getTargets(user) {
    let targetTokens = user.targets || game.user.targets || canvas.tokens?.controlled;

    return new Set([...targetTokens]);
  }

  /**
  * Grab the targeted tokens and return relevant information for hit calculation
  * @returns {TargetDescriptor[]}
  */
  static getTargetDescriptors() {
   const targets = new Map();
   for ( const token of game.user.targets ) {
     const { name } = token;
     const { img, system, uuid, statuses } = token.actor ?? {};
     if ( uuid ) {
       const ac = statuses.has("coverTotal") ? null : system.attributes?.ac?.value;
       targets.set(uuid, { name, img, uuid, ac: ac ?? null });
     } 
   }
   return Array.from(targets.values());
  }

  /**
   * 
   * @param {String} itemUuid 
   * @returns {Actor5e}
   */
  static getActorFromItem(itemUuid){
    const actorId = itemUuid.split(".")[1];
    const actor = game.actors.get(actorId);

    return actor;
  }

/**
 * Checks if module is currently installed and active
 * @param {string} moduleName 
 * @returns 
 */
  static isModuleOn(moduleName){
    const module = game.modules?.get(moduleName);
    return module?.active ? true : false;
  }

  /**
   * Grab the ability name from the flavor text of DDBGL,
   * return an object containing also the abbreviation
   * @param {*} flavorStr 
   * @returns 
   */
  static parseDDBGLAbility(flavorStr){ 
    let abilityObj = null;
    const ddbglStr = `${flavorStr}`;
    // const test = `<span class="action" data-ddb-game-log-click-handler="open_card">Constitution:</span> <span class="rolltype save">Save</span> <span class="rollkind "></span>`;
    CHAR_ABILITIES.forEach(ab=>{
      if(ddbglStr.toLowerCase().includes(ab.name)){
        abilityObj = ab;
      };
    })
    return abilityObj;
  }

  /**
   * checks roll mode to determine if its mode is blind / private
   * @param {String} mode 
   */
  static isPrivateRoll(mode){
    return mode === CONST.DICE_ROLL_MODES.BLIND || mode === CONST.DICE_ROLL_MODES.PRIVATE;
  }

  /**
   * Removes the MeasuredTemplate 
   * @param {Item5e} item 
   */
  static removeTemplateForItem (item) {
    LogUtil.log("removeTemplateForItem - A", [item]);
    const removeTemplateSettingOn = SettingsUtil.get("remove-template");
    LogUtil.log("removeTemplateForItem - B", [removeTemplateSettingOn]);
    if(!removeTemplateSettingOn){ return; }
    const templates = canvas.templates.objects.children.filter(mt => {
      return mt.document.flags.dnd5e.item === item?.uuid;
    });

    canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', templates.map(i=>i.id));
  }


  static html(parent, selector) {
    return parent.querySelector(selector);
  }
}
