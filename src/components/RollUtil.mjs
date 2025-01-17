import { LogUtil } from "./LogUtil.mjs";
import { ActivityUtil } from  "./ActivityUtil.mjs";
import { GeneralUtil } from "./GeneralUtil.mjs";
import { DDBGL_CLS } from "../constants/DDBGL.mjs";
import { MODULE_SHORT } from "../constants/General.mjs";
import ChatMessage5e from "../../dnd5e/module/documents/chat-message.mjs";

export class RollUtil{

  static streamlineDDBRoll = async (ddbglCls, item, actionName, msg, msgData) => {
    let selectedActivity = null, castActivity = null;

    LogUtil.log("streamlineDDBRoll", [ddbglCls, item, {...msg}, msgData]); 
    let config = {}, originalRoll = msg.rolls[0];

    config.dialog = {
      configure: false 
    }; 

    config.roll = {
      formula: originalRoll.formula,
      consume: { resources: false, spellSlot: false },
      rolls: [],
      flags: {
        ...msg.flags, 
        [MODULE_SHORT]: { processed: true },
        dnd5e: {
          ...msg.flags.dnd5e,
          // messageType: "roll" 
        },
        rsr5e: { processed: true, quickRoll: false }
      }
    };
    msg.flags = config.roll.flags;

    config.message = {
      flavor: msg.flavor,
      speaker: msg.speaker,
      whisper: msg.whisper,
      user: game.user,
      blind: msg.blind || GeneralUtil.isPrivateRoll(msgData.rollMode),
      rollMode: msgData.rollMode
    }

    try{
      switch(true){ 
        case ddbglCls===DDBGL_CLS.toHit.cls: // is attack roll
          selectedActivity = ActivityUtil.getActivityFromItem(item, ddbglCls) ?? null; 
          await RollUtil.triggerAttack(selectedActivity, msg, msgData, config);
          
          break; 
        case ddbglCls===DDBGL_CLS.damage.cls :
          selectedActivity = ActivityUtil.getActivityFromItem(item, ddbglCls) ?? null;
          await RollUtil.triggerDamage(selectedActivity, msg, msgData, config);
          
          break; 
        case ddbglCls===DDBGL_CLS.save.cls 
              || ddbglCls===DDBGL_CLS.check.cls:
          selectedActivity = null;
          await RollUtil.triggerAbilityTest(ddbglCls, msg, msgData, config);

          break; 
        case ddbglCls===DDBGL_CLS.heal.cls:
          selectedActivity = ActivityUtil.getActivityFromItem(item, ddbglCls) ?? null;
          await RollUtil.triggerHeal(selectedActivity, msg, msgData, config);

          break;
        case ddbglCls===DDBGL_CLS.custom.cls:
          selectedActivity = null;
          await RollUtil.triggerCustomRoll(config, msg, actionName, msgData);

          break;
        default: 
          LogUtil.log("streamlineDDBRoll",[ddbglCls]);
          // 
      } 
    }catch(e){ 
      LogUtil.error("Error intercepting DDB roll", [e, ddbglCls, item, msg, msgData]);
      // ui.notifications.warn("Could not intercept the DDB roll. Please check if 'description cards' are enabled on DDB Gamelog config options");
      return false; 
    }
    return true;
  } 

  /**
   * If DDB Gamelog message is an attack roll, find the associated activity
   * and roll the attack to trigger animations and automations
   * @param {Activity} selectedActivity 
   * @param {ChatMessage5e} msg 
   * @param {object} msgData 
   * @returns 
   */
  static triggerAttack  = async(selectedActivity, msg, msgData, config) => {
    let usageResults;
    if(!selectedActivity){ throw new Error('No associated activity found.') }

    // config specific to attack rolls
    config.roll.flags.dnd5e.roll = { type: "attack"  };
    config.roll.flags.rsr5e = { processed: true  };
    config.roll.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors();
    config.message.flags = config.roll.flags;

    let activityRolls = await selectedActivity.rollAttack(config.roll, config.dialog, { create: false });
    if(activityRolls.length < 1){ return; }

    // copy terms from the original roll and recalculate
    RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);

    // set the template for the chat message
    const oldTemplate = selectedActivity.metadata.usage.chatCard;
    selectedActivity.metadata.usage.chatCard = `modules/${MODULE_SHORT}/templates/ddb-attack-info.hbs`;

    usageResults = await ActivityUtil.ddbglUse(selectedActivity, config.roll, config.dialog, { 
      create: false,
      data: { 
        rollMsg: msg.content, 
        rolls: activityRolls,
        flags: {
          rsr5e: config.roll.flags.rsr5e,
          [MODULE_SHORT]: { 
            processed: true, 
            rollMode: msgData.rollMode,
            cls: msg.flags["ddb-game-log"].cls,
            flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
                    `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
          }
        }
      }
    });
    usageResults.message.rolls = activityRolls;

    usageResults.message.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors();
    usageResults.message.flags = usageResults.message.flags ?? {};

    LogUtil.log("USAGE RESULTS", [usageResults]);

    await ChatMessage5e.create(usageResults.message, {rollMode: msgData.rollMode });

    // set the template back to normal
    selectedActivity.metadata.usage.chatCard = oldTemplate;
  }

  /**
   * If DDB Gamelog message is a damage roll, find the activity
   * and roll the appropriate method to trigger associated automations 
   * @param {Activity} selectedActivity 
   * @param {ChatMessage5e} msg 
   * @param {object} msgData 
   * @param {object} config 
   * @returns 
   */
  static triggerDamage = async(selectedActivity, msg, msgData, config) => {
    let usageResults;
    if(!selectedActivity){
      throw new Error('No associated activity found.');
    }

    if(!selectedActivity.attack){

      usageResults = await ActivityUtil.ddbglUse(selectedActivity, config.roll, config.dialog, { 
        create: false
      });
      LogUtil.log("ACTIVITY", [usageResults]);
      // usageResults = selectedActivity.use(config.roll, { configure: false }, { create: false });
      await ChatMessage5e.create(usageResults.message, {rollMode: msgData.rollMode }); 
    }

    let activityRolls = await selectedActivity.rollDamage(config.roll, config.dialog, { 
      create: false, // data: { flags: config.message.flags }   
    });

    if(activityRolls.length < 1){ return; }
    RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
    
    if(!usageResults){
      usageResults = { message: config.message }
    }

    usageResults.message.rolls = activityRolls; 
    usageResults.message.flags = usageResults.message.flags ?? {}; 
    usageResults.message.flags.rsr5e = {
      processed: true,
      quickRoll: false
    }

    config.roll.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors();
    config.message.flags = config.roll.flags;

    // await ChatMessage5e.create(config.message, {rollMode: msgData.rollMode }); 
    await activityRolls[0].toMessage(config.message, {rollMode: msgData.rollMode });
    
    if(!selectedActivity.attack){
      game.user.targets.forEach(token => { 
        if(token.actor.testUserPermission(game.user, "OWNER")){ 
          token.control({releaseOthers: false})
        } 
      }); 
    }
    setTimeout(() => {
      GeneralUtil.removeTemplateForItem(selectedActivity.item);
    }, 3000); 
  }
  
  /**
   * If DDB Gamelog message is an ability test (skill, save, check), trigger the appropriate roll
   * Note: In theory, we could just post the original roll, but we'll 
   * use the appropriate roll method here for compatibility with other modules
   * @param {string} testType 
   * @param {ChatMessage5e} msg 
   * @param {object} msgData 
   * @param {object} config 
   * @returns 
   */
  static triggerAbilityTest = async(testType, msg, msgData, config) => {
    const ability = GeneralUtil.parseDDBGLAbility(msg.flags["ddb-game-log"].flavor);
    let testRolls;

    config.roll.flags.dnd5e.roll = {
      type: testType===DDBGL_CLS.check.cls ? "ability" : "save"
    };

    if(ability){
      config.roll.flags.dnd5e.roll.ability = ability.abbrev;
    }
    config.message.flags = config.roll.flags;

    // roll attack from activity without creating ChatMessage
    if(testType===DDBGL_CLS.save.cls){
      testRolls = await msgData.actor.rollSavingThrow({ ability: ability?.abbrev }, config.dialog, { create: false });
    }else if(testType===DDBGL_CLS.check.cls){
      testRolls = await msgData.actor.rollAbilityCheck({ ability: ability?.abbrev }, config.dialog, { create: false });
    }
    
    if(testRolls.length < 1){ return; }

    // copy terms from the original roll and recalculate
    RollUtil.replaceTerms(testRolls[0], msg.rolls[0]);

    // Create message with the provided roll and msg data
    await testRolls[0].toMessage(config.message, {rollMode: msgData.rollMode });
  }

  /**
   * If DDB Gamelog message is a heal roll, find the activity
   * and roll the appropriate method to trigger associated automations 
   * @param {Activity} selectedActivity 
   * @param {object} config 
   * @returns 
   */
  static triggerHeal = async(selectedActivity, msg, msgData, config) => {
    let usageResults;
    if(!selectedActivity){
      throw new Error('No associated activity found.');
    }

    usageResults = await ActivityUtil.ddbglUse(selectedActivity, config.roll, config.dialog, { 
      create: false
    });
    LogUtil.log("ACTIVITY", [usageResults]);
    await ChatMessage5e.create(usageResults.message, {rollMode: msgData.rollMode }); 

    let activityRolls = await selectedActivity.rollDamage(config.roll, config.dialog, { 
      create: false, data: { flags: config.message.flags } 
    });

    if(activityRolls.length < 1){ return; }
    RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
  
    if(!usageResults){
      usageResults = { message: config.message }
    }

    usageResults.message.rolls = activityRolls; 
    usageResults.message.flags = usageResults.message.flags ?? {}; 
    usageResults.message.flags.rsr5e = {
      processed: true,
      quickRoll: false
    }

    // config specific to damage rolls
    config.roll.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors();
    config.message.flags = config.roll.flags;

    await activityRolls[0].toMessage(config.message, {rollMode: msgData.rollMode });
  }

  /**
   * If DDB Gamelog message is a custom roll, just post it
   * @param {object} config 
   */
  static triggerCustomRoll = async(config, msg, actionName, msgData) => {
    config.message.flags = config.roll.flags;

    // Create message with the provided roll and msg data, without modifications
    await msg.rolls[0].toMessage(msg, { ...msgData });
  }

  /**
   * Recalculate roll without rerolling
   * @param {Roll} roll 
   * @returns 
   */
  static resetRollGetters(roll) {
    roll._total = roll._evaluateTotal();
    roll.resetFormula();
    return roll;
  }

  /**
   * Modify the result of a roll
   * @param {Roll} roll // roll whose terms will be replaced
   * @param {Roll} replacer // Roll to use the terms from 
   * @returns {Roll}
   */
  static replaceTerms(roll, replacer){
    roll.terms = replacer.terms;
    roll._total = roll._evaluateTotal();
    roll.resetFormula();
    return roll;
  }
}

/*
// First attempt at getting compatibility with Midi-QOL
// This attempt didn't break midi, but animations dont work and
// dice are rolled twice
if(Main.isMidiOn){
  wf = new MidiQOL.Workflow(
    selectedActivity.actor, 
    selectedActivity, 
    msgData.speaker, 
    GeneralUtil.getTargets(), 
    { 
      // advantage: false,
      // disadvantage: false,
      fastForward: true, 
      fastForwardSet: true, 
      // parts: undefined,
      // chatMessage: undefined, 
      // rollToggle: undefined, 
      // other: undefined, 
      versatile: undefined, 
      isCritical: msg.rolls[0]?.d20?.total == 20, 
      autoRollAttack: false, 
      autoRollDamage: false, 
      fastForwardAttack: true, 
      fastForwardDamage: true, 
      fastForwardAbility: true, 
      // ...config.midiOptions,
      //  event: config.event 
    }
  );
  wf.diceRoll = msg.rolls[0]?.d20?.total;
  wf.noAutoAttack = true;
}
LogUtil.log("MIDI ATTACK WF", [wf])
*/