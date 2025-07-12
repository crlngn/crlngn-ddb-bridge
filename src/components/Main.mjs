import { DDBGL_CLS } from "../constants/DDBGL.mjs";
import { MODULE_SHORT } from "../constants/General.mjs";

import { HOOKS_CORE, HOOKS_DND5E } from "../constants/Hooks.mjs";
import { getSettings } from "../constants/Settings.mjs";
import { ChatUtil } from "./ChatUtil.mjs";
import { GeneralUtil } from "./GeneralUtil.mjs";
import { LogUtil } from "./LogUtil.mjs";
import { RollUtil } from "./RollUtil.mjs";
import { SettingsUtil } from "./SettingsUtil.mjs";
import { SocketUtil } from "./SocketUtil.mjs";

export class Main {
  static keysPressed = [];
  static isMidiOn = false;
  static areKeysPressed;

  static init(){
    Main.setupKeyListeners();
    Main.registerHooks();
  }

  static addCSSLocalization(){
    const locBtnPath = 'CRLNGN.dnd5e.chatCard.buttons';

    LogUtil.log('Test', [game.i18n.translations, game.i18n.translations['CRLNGN']]);
    LogUtil.log(`Full path being requested: ${locBtnPath}.attack`); 
    if (game.i18n.has(`${locBtnPath}.attack`)) {
      // Key exists and should work
      LogUtil.warn(`Key exists`);
    } else {
      LogUtil.warn(`Missing translation key: ${locBtnPath}.attack`);
    }  
    
    GeneralUtil.addCSSVars('--crlngn-i18n-attack', game.i18n.localize(`${locBtnPath}.attack`));
    GeneralUtil.addCSSVars('--crlngn-i18n-damage', game.i18n.localize(`${locBtnPath}.damage`));
    GeneralUtil.addCSSVars('--crlngn-i18n-summons', game.i18n.localize(`${locBtnPath}.summons`));
    GeneralUtil.addCSSVars('--crlngn-i18n-healing', game.i18n.localize(`${locBtnPath}.healing`));
    GeneralUtil.addCSSVars('--crlngn-i18n-template', game.i18n.localize(`${locBtnPath}.template`));
    GeneralUtil.addCSSVars('--crlngn-i18n-consume', game.i18n.localize(`${locBtnPath}.consume`));
    GeneralUtil.addCSSVars('--crlngn-i18n-refund', game.i18n.localize(`${locBtnPath}.refund`));
    GeneralUtil.addCSSVars('--crlngn-i18n-macro', game.i18n.localize(`${locBtnPath}.macro`));
    GeneralUtil.addCSSVars('--crlngn-i18n-save-dc', game.i18n.localize(`${locBtnPath}.savedc`));
  }

  static registerHooks(){
    SocketUtil.initialize(() => {
      LogUtil.log("SocketUtil - initialized with socket", [SocketUtil.socket, game.system.utils.areKeysPressed]);
      // Main.areKeysPressed = game.system.utils.areKeysPressed;
    });
    Hooks.once(HOOKS_CORE.INIT,()=>{
      Main.isMidiOn = GeneralUtil.isModuleOn("midi-qol");
      LogUtil.log("Initiating module", [], true);
      document.querySelector("body").classList.add("crlngn-ddbgl-chat"); //add here for better rendering, remove later if needed
      
      SettingsUtil.registerSettings();
      Main.registerActivityHooks();
      Main.registerRollHooks();
      Main.registerChatHooks();
      Main.registerTemplateHooks(); 
    })

    Hooks.once(HOOKS_CORE.READY, () => { 
      // Check if Foundry has socket support enabled
      if (!game.socket) {
        ui.notifications.error("⚠️ DDB Bridge: Foundry needs to be restarted to enable socket functionality.", { permanent: true });
        LogUtil.error("Foundry restart required to enable sockets.");
        return;
      }

      SettingsUtil.resetGamelogSettings();
      Main.registerSocketFunction();
      Main.addCSSLocalization();
      ChatUtil.init();
    });

    Hooks.on(HOOKS_CORE.CLOSE_SETTINGS_CONFIG, () => {
      SettingsUtil.resetGamelogSettings();
    })
  }

  /**
   * 
   */
  static registerSocketFunction(){
    SocketUtil.registerCall('DDBRoll', RollUtil.streamlineDDBRoll);
  }

  /**
   * Listen to activity usage hooks
   */
  static registerActivityHooks(){
    Hooks.on(HOOKS_DND5E.PRE_USE_ACTIVITY, onPreUseActivity);
    Hooks.on(HOOKS_DND5E.POST_USE_ACTIVITY, onPostUseActivity);
  }

  /**
   * Listen to roll hooks
   */
  static registerRollHooks(){
    Hooks.on(HOOKS_DND5E.ROLL_ATTACK_V2, onRollAttack);
    Hooks.on(HOOKS_DND5E.ROLL_DAMAGE_V2, onRollDamage);
    Hooks.on(HOOKS_DND5E.PRE_ROLL_V2, onPreRoll);
    Hooks.on(HOOKS_DND5E.PRE_ROLL_ATTACK_V2, onPreRollAttack);
    Hooks.on(HOOKS_DND5E.PRE_ROLL_DAMAGE_V2, onPreRollDamage);
    Hooks.on(HOOKS_DND5E.PRE_ROLL_SAVING_THROW, onPreRollSavingThrow);
    // Hooks.on(HOOKS_CORE.RENDER_ROLL_RESOLVER, RollUtil.onRenderRollResolver);
  }

  /**
   * Listen to ChatMessage hooks
   */
  static registerChatHooks(){
    Hooks.on(HOOKS_DND5E.RENDER_CHAT_MESSAGE, onRenderChatMessage); 
    Hooks.on(HOOKS_CORE.PRE_CREATE_CHAT_MESSAGE, onPreCreateChatMessage); 
    Hooks.on(HOOKS_CORE.CREATE_CHAT_MESSAGE, onCreateChatMessage); 
  }

  /**
   * Listen to template hooks
   */
  static registerTemplateHooks(){
    Hooks.on(HOOKS_CORE.REFRESH_MEASURED_TEMPLATE, onRefreshTemplate); 
  }

  static setupKeyListeners(){
    // Listen to keydown event and store keys
    window.addEventListener('keydown', (event) => {
      const keyPressed = event.key;
      const index = Main.keysPressed.indexOf(keyPressed);

      if(index < 0){
        Main.keysPressed.push(keyPressed);
      }
      // LogUtil.log("Keydown", [Main.keysPressed]);
    });

    // Listen to keyup event and remove keys
    window.addEventListener('keyup', (event) => {
      const keyReleased = event.key;
      const index = Main.keysPressed.indexOf(keyReleased);

      if(index >= 0){
        Main.keysPressed.splice(index,1);
      }
      // LogUtil.log("Keyup", [Main.keysPressed]); 
    });
  }

}

/**
 * Before activity.use() is fulfilled
 * @param {object} activity 
 * @param {object} usageConfig 
 * @param {object} dialogConfig 
 * @param {object} msgConfig 
 * @returns {Boolean}
 */
const onPreUseActivity = async (
  activity, usageConfig, dialogConfig, msgConfig
) => {

  // By default, configuration dialog is disabled to speed up roll
  // Allow configuration if Shift key is pressed
  // if(Main.keysPressed.indexOf("Shift")==-1){
  //   dialogConfig.configure = false;
  // }else{
  //   dialogConfig.configure = true;
  // }
  // dialogConfig.configure = RollUtil.getDialogSetting(dialogConfig.configure, usageConfig);

  LogUtil.log(HOOKS_DND5E.PRE_USE_ACTIVITY, [ usageConfig, dialogConfig, msgConfig, Main.keysPressed ]);

  return true;
}

/**
 * After activity.use() is fulfilled
 * @param {*} activity 
 * @param {*} usageConfig 
 * @param {*} result 
 * @returns {Boolean}
 */
const onPostUseActivity = async(
  activity, usageConfig, result
) => {
  LogUtil.log(HOOKS_DND5E.POST_USE_ACTIVITY, [activity, usageConfig, result]);
  return true;
}

/**
 * Right before a message is created. 
 * @param {ChatMessage5e} chatMessage 
 * @param {GenericObject} msgConfig 
 * @param {GenericObject} options
 * @param {String} userId
 * @returns {Boolean}
 */
const onPreCreateChatMessage = (chatMessage, msgConfig, options, userId) => {
  const SETTINGS = getSettings();
  let isDdbGl = false;
  let actor, ddbglCls, itemId, item, isProcessed=false;
  
  let msg = chatMessage;
  ddbglCls = GeneralUtil.isModuleOn("ddb-game-log") ? chatMessage.getFlag("ddb-game-log","cls")?.toLowerCase() || "" : ""; // does the flag exist?
  isProcessed = chatMessage.getFlag(MODULE_SHORT, "processed") || false; 

  LogUtil.log(HOOKS_CORE.PRE_CREATE_CHAT_MESSAGE, [ 
    ddbglCls, msg, msgConfig, options
  ]);

  if(ddbglCls && !isProcessed){ 
    actor = msgConfig.actor || game.actors.get(msgConfig.speaker.actor) || null;
    itemId =  msgConfig.flags?.["ddb-game-log"]?.["itemId"] || ""; 
    msg.rolls = msg.rolls && msg.rolls.length > 0 ? [msg.rolls[0]] : [msgConfig.rolls[0]] || [];

    LogUtil.log("onPreCreateChatMessage", [msg.flags, msgConfig.flags]);
    if(actor){
      isDdbGl = true; 
      msg.flags = {
        ...msg.flags,
        ...msgConfig.flags
      }
      if(msg.flags[MODULE_SHORT]){
        msg.flags[MODULE_SHORT].processed = true;
        isProcessed = true;
      }
      const flavorElem = document.createElement("div");
      flavorElem.innerHTML = msgConfig.flavor;
      let actionName = flavorElem?.querySelector("span:first-child")?.innerHTML.replace(":","");

      item = actionName ? GeneralUtil.findItemFromActor(msgConfig.speaker.actor, itemId, actionName) : null;

      if(!item && 
        ( ddbglCls === DDBGL_CLS.toHit.cls || 
          ddbglCls === DDBGL_CLS.damage.cls || 
          ddbglCls === DDBGL_CLS.heal.cls) ){ 
        LogUtil.error("Could not find an item for the roll", [ddbglCls, actionName, actor.items]);
        return true; 
      }else{
        
        const user = GeneralUtil.getUserFromActor(msg.speaker?.actor);
        const playerMakesRoll = SettingsUtil.get(SETTINGS.ddbRollOwnership.tag) == 2;
        // destructure the roll before sending via socket
        // msgConfig = JSON.stringify(msgConfig);
        // msg.rolls = msg.rolls.map(roll => roll.toJSON());

        LogUtil.log("Main - onPreCreateChatMessage", [msg, user, playerMakesRoll]);

        // Forward the action to a player or keep it on GM depending on current settings
        if(user && playerMakesRoll){
          LogUtil.log("Main - Before serialization", [msg]);
          const serializedMsg = SocketUtil.serializeForTransport(msg);
          LogUtil.log("Main - After serialization", [serializedMsg]);
          LogUtil.log("CHECK ROLL", [playerMakesRoll, user, serializedMsg, msgConfig]);
          // SocketUtil.execForUser('DDBRoll', user.id, ddbglCls, itemId, actionName, msg, msgConfig); 
          SocketUtil.execForUser('DDBRoll', user.id, ddbglCls, itemId, actionName, serializedMsg, msgConfig); 
        }else{
          LogUtil.log("Main - No serialization", [msg]);
          RollUtil.streamlineDDBRoll(ddbglCls, itemId, actionName, msg, msgConfig);
        }
      }
    }else{ 
      LogUtil.warn("Could not find the actor from DDB Gamelog roll");
      return true;
    }
  }

  return !isDdbGl || isProcessed;
}

const onCreateChatMessage = (chatMessage, options, userId) => {
  LogUtil.log(HOOKS_CORE.CREATE_CHAT_MESSAGE,[chatMessage, options, userId]);   
}

/**
 * Triggered when a message is rendered
 * @param {ChatMessage} msg
 * @param {HTMLElement} html
 */
const onRenderChatMessage = (chatMessage, html) => { 
  LogUtil.log(HOOKS_DND5E.RENDER_CHAT_MESSAGE,[chatMessage, html]);

  ChatUtil.enrichCard(chatMessage, html);
}

const onPreRoll = (rollConfig, dialogConfig, messageConfig) => {
  LogUtil.log(HOOKS_DND5E.PRE_ROLL_V2, [rollConfig, dialogConfig, messageConfig]);

  // dialogConfig.configure = false;
  dialogConfig.configure = RollUtil.getDialogSetting(dialogConfig.configure, rollConfig);

  return;
}

const onPreRollSavingThrow = (rollConfig, dialogConfig, messageConfig) => {
  LogUtil.log(HOOKS_DND5E.PRE_ROLL_SAVING_THROW, [rollConfig, dialogConfig, messageConfig]);

  return;
}

/**
 * Before the attack roll
 * @param {*} config 
 * @param {*} dialog 
 * @param {*} message 
 * @returns 
 */
const onPreRollAttack = (
  config, dialogConfig, message
) =>{
  LogUtil.log(HOOKS_DND5E.PRE_ROLL_ATTACK_V2, [message, dialogConfig, config]);

  return true;
}

/**
 * Before the damage roll
 * @param {*} config 
 * @param {*} dialog 
 * @param {*} message 
 * @returns 
 */
const onPreRollDamage = (
  config, dialogConfig, message
) =>{
  LogUtil.log(HOOKS_DND5E.PRE_ROLL_DAMAGE_V2, [config, dialogConfig, message, Main.keysPressed]);
  // By default, configuration dialog is disabled to speed up roll
  // Allow configuration if Shift key is pressed
  // if(Main.keysPressed.indexOf("Shift")==-1){
  //   dialogConfig.configure = false;
  // }
  return true;
}

const onRollDamage = (
  config, dialogConfig, message
) =>{
  LogUtil.log(HOOKS_DND5E.ROLL_DAMAGE_V2, [game]);
  // canvas.templates.deleteMany(canvas.templates.placeables.map(o =>o.id),{});
}

/**
 * rollAttackV2 hook callback
 * @param {D20Roll[]} rolls 
 * @param {AttackRollData} data
 */
const onRollAttack = async(rolls, data, c, d) => {
  LogUtil.log(HOOKS_DND5E.ROLL_ATTACK_V2, [rolls, data, c, d]);

  const isMidiOn = GeneralUtil.isModuleOn('midi-qol');
  if(isMidiOn){
    LogUtil.log(HOOKS_DND5E.ROLL_ATTACK_V2, [MidiQOL.getWorkflow]);
    // RollUtil.replaceDie(rolls[0], )
  }
}

/**
 * TEMPLATES
 */
const onRefreshTemplate = (template, options) => {
  // LogUtil.log(HOOKS_CORE.REFRESH_MEASURED_TEMPLATE, [template, options]);

  if(!template.isOwner){ return; }

  const templateTargeting = SettingsUtil.get("template-auto-target");
  let maxDisposition = 3;

  switch(templateTargeting){
    case 1:
      maxDisposition = 3; break;
    case 2: 
      maxDisposition = 0; break;
    default: 
      return;
  }

  canvas.tokens.placeables[0]?.setTarget(false, { releaseOthers: true });
  for(let token of canvas.tokens.placeables){
    if(token.document.disposition <= maxDisposition && template.shape.contains(token.center.x-template.x,token.center.y-template.y)){
      token.setTarget(!token.isTargeted, { releaseOthers: false });
    }
  }
}