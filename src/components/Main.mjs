import { MODULE_SHORT } from "../constants/General.mjs";

import { HOOKS_CORE, HOOKS_DND5E } from "../constants/Hooks.mjs";
import { GeneralUtil } from "./GeneralUtil.mjs";
import { LogUtil } from "./LogUtil.mjs";
import { RollUtil } from "./RollUtil.mjs";
import { SettingsUtil } from "./SettingsUtil.mjs";

export class Main {
  static keysPressed = [];
  static isMidiOn = false;

  static init(){
    // Main.setupKeyListeners();
    Main.registerHooks();
  }

  static registerHooks(){

    Hooks.once(HOOKS_CORE.INIT,()=>{

      Main.registerActivityHooks();
      Main.registerRollHooks();
      Main.registerChatHooks();
      Main.registerTemplateHooks();
      SettingsUtil.registerSettings();

      Main.isMidiOn = GeneralUtil.isModuleOn("midi-qol");
      LogUtil.log("Initiating module",[CONFIG, Main.isMidiOn], null, true);
    })
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
      LogUtil.log("Keydown", [Main.keysPressed]);
    });

    // Listen to keyup event and remove keys
    window.addEventListener('keyup', (event) => {
      const keyReleased = event.key;
      const index = Main.keysPressed.indexOf(keyReleased);

      if(index >= 0){
        Main.keysPressed.splice(index,1);
      }
      LogUtil.log("Keyup", [Main.keysPressed]); 
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
  if(Main.keysPressed.indexOf("Shift")==-1){
    dialogConfig.configure = false;
  }else{
    dialogConfig.configure = true;
  }

  LogUtil.log(HOOKS_DND5E.PRE_USE_ACTIVITY, [ activity, usageConfig, dialogConfig, msgConfig, Main.keysPressed ]);

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
  let isDDBGL = false;
  let actor, ddbglCls, itemId, item, isProcessed=false;
  
  const msg = { ...chatMessage };
  ddbglCls = chatMessage.getFlag("ddb-game-log","cls"); // does the flag exist?
  isProcessed = chatMessage.getFlag(MODULE_SHORT, "processed") || false;

  LogUtil.log(HOOKS_CORE.PRE_CREATE_CHAT_MESSAGE, [ 
    ddbglCls, chatMessage, {...msgConfig}, options
  ]);

  if(ddbglCls && !isProcessed){ 
    isDDBGL = true; 
    actor = msgConfig.actor || null;
    itemId =  msgConfig.flags?.["ddb-game-log"]?.["itemId"] || ""; 

    msg.flags = {
      ...msg.flags,
      ...msgConfig.flags
    }
    if(msg.flags[MODULE_SHORT]){
      msg.flags[MODULE_SHORT].processed = true;
      isProcessed = true;
    }
    
    LogUtil.log(HOOKS_CORE.PRE_CREATE_CHAT_MESSAGE + " B", [msgConfig, msg, Main.isMidiOn])
    if(actor){
      item = itemId ? actor.items.find((it) => it.id == itemId) : "";
      RollUtil.streamlineDDBRoll(ddbglCls, item, msg, msgConfig);
    }
  }

  return !isDDBGL || isProcessed;
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
  let senderSubtitle = html.querySelector(".message-sender .subtitle");
  let senderFlavor = html.querySelector(".message-sender .flavor-text");
  let headerFlavor = html.querySelector(".message-header .flavor-text");

  html.classList.remove('ddb-game-log-open-card');
  /** replace author subtitle with flavor text, for space optimization */
  const flavorText = headerFlavor?.innerHTML || "";
  LogUtil.log(HOOKS_DND5E.RENDER_CHAT_MESSAGE,[flavorText, chatMessage, html, html.querySelector(".message-header .flavor-text")]);
  if(flavorText !== ""){
    if(senderSubtitle) senderSubtitle.innerHTML = flavorText;
    if(senderFlavor) senderFlavor.innerHTML = flavorText;
  }
}

const onPreRoll = (rollConfig, dialogConfig, messageConfig) => {
  LogUtil.log(HOOKS_DND5E.PRE_ROLL_V2, [rollConfig, dialogConfig, messageConfig]);

  dialogConfig.configure = false;

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
  LogUtil.log(HOOKS_DND5E.PRE_ROLL_ATTACK_V2, [config, dialogConfig, message, Main.keysPressed]);
  
  // By default, configuration dialog is disabled to speed up roll
  // Allow configuration if Shift key is pressed
  if(Main.keysPressed.indexOf("Shift")==-1){
    dialogConfig.configure = false;
  }

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
  if(Main.keysPressed.indexOf("Shift")==-1){
    dialogConfig.configure = false;
  }
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
const onRollAttack = async(rolls, data) => {
  LogUtil.log(HOOKS_DND5E.ROLL_ATTACK_V2, [rolls, data]);
}

/**
 * TEMPLATES
 */
const onRefreshTemplate = (template, options) => {
  // LogUtil.log(HOOKS_CORE.REFRESH_MEASURED_TEMPLATE, [template, options]);

  if(!template.isOwner){ return; }

  canvas.tokens.placeables[0]?.setTarget(false, { releaseOthers: true });
  for(let token of canvas.tokens.placeables){
    if(template.shape.contains(token.center.x-template.x,token.center.y-template.y)){
      token.setTarget(!token.isTargeted, { releaseOthers: false });
    }
  }
}