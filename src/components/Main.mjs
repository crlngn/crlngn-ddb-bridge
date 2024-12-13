import { ROLL_MSG_STATES } from "../constants/ChatMessage.mjs";
import { DDBGL_CLS } from "../constants/DDBGL.mjs";
import { ACTIVITY_TYPES, MODULE_SHORT } from "../constants/General.mjs";

import { HOOKS_CORE, HOOKS_DDBGL, HOOKS_DND5E } from "../constants/Hooks.mjs";
import { ActivityUtil } from "./ActivityUtil.mjs";
import { ChatUtil } from "./ChatUtil.mjs";
import { LogUtil } from "./LogUtil.mjs";
import { RollUtil } from "./RollUtil.mjs";

export class Main {

  static registerHooks(){

    Hooks.once(HOOKS_CORE.INIT,()=>{
      LogUtil.log("Initiating module",[CONFIG]);

      Main.registerActivityHooks();
      Main.registerRollHooks();
      Main.registerChatHooks();
      // Main.registerDDBGLHooks();

      ActivityUtil.init();
    })
  }

  // static registerDDBGLHooks(){
  //   Hooks.on(HOOKS_DDBGL.FULFILLED_ROLL, (data:any) => {
  //     LogUtil.log(HOOKS_DDBGL.FULFILLED_ROLL, [data]);
  //   });
  //   // LogUtil.log("registerDDBGLHooks");
  // }

  static registerActivityHooks(){
    Hooks.on(HOOKS_DND5E.PRE_USE_ACTIVITY, onPreUseActivity);
    Hooks.on(HOOKS_DND5E.POST_USE_ACTIVITY, onPostUseActivity);
  }

  static registerRollHooks(){
    Hooks.on(HOOKS_DND5E.ROLL_ATTACK_V2, onRollAttack);
    Hooks.on(HOOKS_DND5E.PRE_ROLL_ATTACK_V2, onPreRollAttack);
    Hooks.on(HOOKS_DND5E.PRE_ROLL_DAMAGE_V2, onPreRollDamage);
  }

  static registerChatHooks(){
    Hooks.on(HOOKS_DND5E.RENDER_CHAT_MESSAGE, onRenderChatMessage); 
    Hooks.on(HOOKS_CORE.PRE_CREATE_CHAT_MESSAGE, onPreCreateChatMessage); 
  }

}

const onPreUseActivity = async (
  activity, usageConfig, dialogConfig, msgConfig
) => {
  // if(msgConfig && msgConfig.data && msgConfig.data.flags){
  //   msgConfig.data.flags[MODULE_SHORT] = {
  //     fastForwardActivity: true,
  //     state: ROLL_MSG_STATES.preUse
  //   }
  // }
  if(dialogConfig){
    dialogConfig.configure = false
  }
  LogUtil.log(HOOKS_DND5E.PRE_USE_ACTIVITY, [ activity, usageConfig, dialogConfig, msgConfig ]);
  
  // if(activity.type === ACTIVITY_TYPES.attack){
  //   // const rolls = await activity.rollAttack(usageConfig || {}, dialogConfig || {}, msgConfig || {});
  // }
  // ActivityUtil.fastForwardActivity(activity, {
  //   usage: usageConfig,
  //   dialog: {...dialogConfig, configure: false},
  //   msg: msgConfig
  // }); 

  return true;
}

const onPostUseActivity = async(
  activity, usageConfig, result
) => {
  LogUtil.log(HOOKS_DND5E.POST_USE_ACTIVITY, [activity, usageConfig, result]);

  // RollUtil.fastForwardRoll(activity, {
  //   usage: usageConfig
  // });
  // return;
  return true;
}

/**
 * Right before a message is created. 
 * 
 * @param {ChatMessage5e} chatMessage 
 * @param {GenericObject} msgConfig 
 * @param {GenericObject} options
 * @param {String} userId
 */
const onPreCreateChatMessage = (chatMessage, msgConfig, options, userId) => {
  let isDDBGL = false;
  let activities, activity, actor, ddbglCls, itemId, item, isCrlngn;
  
  const msg = { ...chatMessage };
  ddbglCls = chatMessage.getFlag("ddb-game-log","cls"); // does the flag exist?
  isCrlngn = chatMessage.getFlag(MODULE_SHORT, "originalRoll");

  LogUtil.log(HOOKS_CORE.PRE_CREATE_CHAT_MESSAGE, [ 
    chatMessage, ddbglCls
  ]);

  if(ddbglCls && !isCrlngn){ 
    isDDBGL = true; 
    actor = msgConfig.actor; 
    itemId =  msgConfig.flags?.["ddb-game-log"]?.["itemId"] || ""; 
    
    LogUtil.log(HOOKS_CORE.PRE_CREATE_CHAT_MESSAGE, [ 
      actor, itemId
    ]);
    if(actor && itemId){
      item = actor.items.find((it) => it.id == itemId);
      
      activities = item?.system?.activities || null; 
      LogUtil.log("activities", [itemId, activities]);
      activity = activities ? ActivityUtil.forwardAction(ddbglCls, activities, msg, msgConfig) : null;
    } 
  } 

  return !isDDBGL;
}

const onRenderChatMessage = (a, b, c, d) => {
  LogUtil.log(HOOKS_DND5E.RENDER_CHAT_MESSAGE,[a,b,c,d])
}

// 
// const onPreCreateUsageMessage = (activity:Activity, messageConfig:ActivityMessageConfiguration) => {

// }


// /**
//  * Triggered when a message is rendered
//  * @param a 
//  * @param b 
//  * @param c 
//  * @param d 
//  */
// const onRenderChatMessage = (a: any, b: any, c: any, d: any) => {
//   LogUtil.log(HOOKS_CORE.RENDER_CHAT_MESSAGE, [a, b, c, d]);
// }

/** 
 * Rolls 
 * */
const onPreRollAttack = (
  config, dialog, message
) =>{
  LogUtil.log(HOOKS_DND5E.PRE_ROLL_ATTACK_V2, [config, dialog, message]);
  dialog.configure = false;
  return true
}

const onPreRollDamage = (
  config, dialog, message
) =>{
  LogUtil.log(HOOKS_DND5E.PRE_ROLL_DAMAGE_V2, [config, dialog, message]);
  dialog.configure = false;
  return true;
}

/**
 * rollAttackV2 hook callback
 * @param {D20Roll[]} rolls 
 * @param {AttackRollData} data
 */
const onRollAttack = async(rolls, data) => {
  LogUtil.log(HOOKS_DND5E.ROLL_ATTACK_V2, [rolls, data]);
  // ChatUtil.processChatCard(rolls, data);
}