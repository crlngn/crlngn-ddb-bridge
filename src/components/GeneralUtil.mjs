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
    let gm = game.users.find(us=>us.isGM===true);
    let targetTokens = user.targets || gm.targets; // || canvas.tokens?.controlled;

    return new Set([...targetTokens]);
  }

  static getClientTargets = () => {
    if (!game.user) return [];

    // Convert the Set of targets to an array
    const selectedTargets = Array.from(game.user.targets);//.filter(target => target.actor);

    LogUtil.log("Selected Targets", [ 
      game.user.id, 
      selectedTargets, 
      selectedTargets.filter(target => target.actor) 
    ]);
    return selectedTargets;
  };



  /**
  * Grab the targeted tokens and return relevant information for hit calculation
  * @returns {TargetDescriptor[]}
  */
  static getTargetDescriptors = () => {
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
  // static getTargetDescriptors({ actorId, user }) {
  //   const targets = new Map();
  //   //  let currUser = user || (actorId ? GeneralUtil.getUserFromActor(actorId) : game.user) || []
  //   const userTargets = getClientTargets() || []; 
  //   LogUtil.log("getTargetDescriptors", [userTargets]);

  //   for ( const token of currUser.targets ) {
  //     const { name } = token;
  //     const { img, system, uuid, statuses } = token.actor ?? {};
  //     if ( uuid ) {
  //       const ac = statuses.has("coverTotal") ? null : system.attributes?.ac?.value;
  //       targets.set(uuid, { name, img, uuid, ac: ac ?? null });
  //     } 
  //   }
  //   return Array.from(targets.values());
  // }

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

  static findItemFromActor = (actorId, itemId, actionName) => {
    const actor = game.actors.get(actorId);
    LogUtil.log("findItemFromActor", [itemId, actionName]);
    if(!actor) return null;

    let item = itemId ? actor.items.find((it) => {
      return it.id === itemId; 
    }) : null; 

    if(!item){ 
      // match exact name
      item = actionName ? actor.items.find((it) => it.name.toLowerCase() === actionName.toLowerCase()) : null;
      // if no exact name, look for the name with "(Legacy)" tag
      if(!item){ item = actor.items.find((it) => it.name.toLowerCase() === (actionName + " (Legacy)").toLowerCase()) };
    } 

    return item;
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

  static getUserFromActor(actorId){
    let owner;
    if(!actorId){ return null; }
    const actor = actorId ? game.actors.get(actorId) : null;
    
    let assignedPlayer = game.users.players.find(pl=>{
      return pl.active === true && pl.character.id === actorId;
    });
    owner = assignedPlayer;

    if(!owner){ 
      // owner = game.users.find(u => u.isGM===true); 
      game.users.players.forEach(pl => {
        if(pl.active && actor.testUserPermission(pl, foundry.CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER, { exact:true })){
          owner = pl;
        }
      });
    }

    // let gm = game.users.find(u => u.isGM===true);
    LogUtil.log("getUserFromActor", [actorId, owner]);

    return owner;
  }


  static html(parent, selector) {
    return parent.querySelector(selector);
  }
}
