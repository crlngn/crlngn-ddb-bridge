import { LogUtil } from "./LogUtil.mjs";
import { ActivityUtil } from  "./ActivityUtil.mjs";
import { GeneralUtil } from "./GeneralUtil.mjs";
import { DDBGL_CLS } from "../constants/DDBGL.mjs";
import { MODULE_SHORT, ROLL_TYPES } from "../constants/General.mjs";
import { SettingsUtil } from "./SettingsUtil.mjs";
import { getSettings } from "../constants/Settings.mjs";
import { Main } from "./Main.mjs";
import { SocketUtil } from "./SocketUtil.mjs";

export class RollUtil{

  // ddbglCls, itemId, actionName, msg, msgConfig
  static streamlineDDBRoll = async (ddbglCls, itemId, actionName, message, messageData) => {
    LogUtil.log('streamlineDDBRoll - A', [message, messageData]);
    let msg = message;
    let msgData = messageData;
    
    if(ddbglCls && !game.user.isGM){
      msg = SocketUtil.deserializeFromTransport(message);
    }

    // Set the author
    msgData.author = game.user;

    let selectedActivity = null;
    let user = game.user;
    let item = actionName ? GeneralUtil.findItemFromActor(msgData.speaker.actor, itemId, actionName) : null;
    let actor = game.actors.get(msgData.actor._id);
    if(actor){
      msgData.actor = actor;
    }
    // msg.rolls = msg.rolls.map(rollData => Roll.fromJSON(rollData));
    
    // const json = JSON.parse(msg);
    LogUtil.log('streamlineDDBRoll - B', [msgData, msg, game.messages.get(msg.id || msg._id)]);

    let config = {}, originalRoll = msg.rolls[0];

    config.message = {
      flavor: msg.flavor,
      speaker: msg.speaker,
      whisper: msg.whisper,
      user: user,
      blind: msg.blind || GeneralUtil.isPrivateRoll(msgData.rollMode),
      rollMode: msgData.rollMode
    }

    config.dialog = {
      configure: false
    }; 

    config.roll = {
      subsequentActions: false,
      formula: originalRoll.formula,
      consume: { resources: false, spellSlot: false },
      user: user,
      rolls: [msg.rolls[0]],
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
      LogUtil.error("Error intercepting DDB roll", [e], { ui:false, console:true, permanent:false });
      ui.notifications.warn("Could not intercept the DDB roll");
      return false; 
    }
    return true;
  } 

  /**
   * If DDB Gamelog message is an attack roll, find the associated activity
   * and roll the attack to trigger animations and automations
   * @param {Activity} selectedActivity 
   * @param {ChatMessage} msg 
   * @param {object} msgData 
   * @returns 
   */
  static triggerAttack  = async(selectedActivity, msg, msgData, config) => {
    const SETTINGS = getSettings();
    let usageResults, activityRolls, workflow;
    let oldTemplate;
    const isMidiOn = GeneralUtil.isModuleOn("midi-qol");
    if(!selectedActivity){ throw new Error('No associated activity found.') }

    // config specific to attack rolls
    const targets = GeneralUtil.getTargetDescriptors({user: game.user});
    config.roll.target = targets.length === 1 ? targets[0].ac : undefined;
    config.roll.flags.rsr5e = { processed: true  };
    // config.roll.flags.dnd5e.targets = targets;
    config.roll.flags.dnd5e.roll = { type: ROLL_TYPES.attack }; 

    // LogUtil.log("triggerAttack", [config, selectedActivity]);
    // LogUtil.log("triggerAttack - isMidiOn", [isMidiOn, selectedActivity, usageResults]);

    if(isMidiOn){
      LogUtil.log("MidiQOL is not supported yet");
      // workflow = new MidiQOL.Workflow(selectedActivity.actor, selectedActivity, msg.speaker, config.message.user.targets, { 
      //   workflowOptions: { attackRollDSN: false, damageRollDSN: false }
      // });

      // activityRolls = await selectedActivity.rollAttack({
      //   ...config.roll,
      //   midiOptions: {
      //     workflowOptions: { attackRollDSN: false, damageRollDSN: false }
      //   }
      // }, 
      // config.dialog, 
      // { 
      //   create: false,
      //   data: {
      //     ...config.message 
      //   }
      // });
      // if(activityRolls.length < 1){ return; }

      // LogUtil.log("triggerAttack - rolls", [activityRolls[0], msg.rolls[0]]);
      
      // // copy terms from the original roll and recalculate
      // if(SettingsUtil.get(SETTINGS.foundryRollModifiers.tag)){
      //   activityRolls[0] = RollUtil.replaceDie(activityRolls[0], msg.rolls[0]);
      // }else{
      //   activityRolls[0] = RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
      // }

      // LogUtil.log("triggerAttack - activityRolls", [activityRolls, usageResults, workflow]);

      // usageResults = await selectedActivity.use({
      //   ...config.roll,
      //   midiOptions: {
      //     workflowOptions: { attackRollDSN: false }
      //   }
      // }, config.dialog, { 
      //   create: true,
      //   data: { 
      //     // rollMsg: msg.content, 
      //     rolls: [activityRolls[0]],
      //     user: config.message.user,
      //     speaker: config.message.speaker,
      //     flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
      //                 `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`,
      //     // flags: {
      //     //   rsr5e: config.roll.flags.rsr5e,
      //     //   [MODULE_SHORT]: { 
      //     //     processed: true, 
      //     //     data: { msg, msgData },
      //     //     rollMode: msgData.rollMode,
      //     //     cls: msg.flags["ddb-game-log"].cls,
      //     //     flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
      //     //             `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
      //     //   }
      //     // }
      //     [MODULE_SHORT]: { 
      //       processed: true, 
      //       data: { msg, msgData },
      //       rollMode: msgData.rollMode,
      //       cls: msg.flags["ddb-game-log"].cls,
      //       flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
      //               `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
      //     }
      //   }
      // });
      // if(usageResults){
      //   LogUtil.log("Usage of attack activity was not completed", [selectedActivity]);
      // }
      // usageResults.message.rolls = [activityRolls[0]];
      // workflow.itemCardUuid = usageResults.message.uuid;
      // if (workflow.suspended) workflow.unSuspend.bind(workflow)({ attackRoll: activityRolls[0] })
      // await workflow.setAttackRoll(activityRolls[0]);
      // // activityRolls[0] = await MidiQOL.processAttackRollBonusFlags.bind(workflow)();
      // if (["formulaadv", "adv"].includes(MidiQOL.configSettings.rollAlternate)) addAdvAttribution(activityRolls[0], workflow.attackAdvAttribution);
      // await workflow.setAttackRoll(activityRolls[0]);

      // // activityRolls[0] = await workflow.processAttackRollBonusFlags.bind(workflow)();
      // // await workflow.setAttackRoll(activityRolls[0]);
      // // await workflow.WorkflowState_AttackRollComplete();
      // // await workflow.checkHits();

      // const midiApi = game.modules.get("midi-qol")?.api;
      // LogUtil.log("> MidiQOL API", [MidiQOL]); 

      // /**********/
      // if (MidiQOL.configSettings.autoCheckHit !== "none") {
      //   await workflow.displayAttackRoll({ GMOnlyAttackRoll: true });
      //   await workflow.checkHits();
      //   await workflow.displayAttackRoll();
  
      //   const rollMode = config.message.rollMode;
      //   workflow.whisperAttackCard = MidiQOL.configSettings.autoCheckHit === "whisper" || rollMode === CONST.DICE_ROLL_MODES.BLIND || rollMode === CONST.DICE_ROLL_MODES.PRIVATE;
      //   if (workflow.aborted){
      //     return workflow.WorkflowState_Abort;
      //   }
      //   await workflow.displayHits(workflow.whisperAttackCard);
      // } else {
      //   await workflow.displayAttackRoll();
      // }
      // /**********/

      // LogUtil.log("triggerAttack - after use", [usageResults, selectedActivity.utils]);
    }else{
      // set the template for the chat message
      oldTemplate = selectedActivity.metadata.usage.chatCard;
      selectedActivity.metadata.usage.chatCard = `modules/${MODULE_SHORT}/templates/ddb-attack-info.hbs`;

      activityRolls = await selectedActivity.rollAttack(config.roll, config.dialog, { 
        create: false,
        data: {
          ...config.message 
        }
      });
      if(activityRolls.length < 1){ return; }

      LogUtil.log("triggerAttack - before", [activityRolls, msg.rolls, GeneralUtil.getTargetDescriptors({user: game.user})]);
      // copy terms from the original roll and recalculate
      if(SettingsUtil.get(SETTINGS.foundryRollModifiers.tag)){
        activityRolls[0] = RollUtil.replaceDie(activityRolls[0], msg.rolls[0]);
      }else{
        activityRolls[0] = RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
      }
      LogUtil.log("triggerAttack - after", [activityRolls, msg.rolls]);

      config.roll.subsequentActions = false;
      usageResults = await ActivityUtil.ddbglUse(selectedActivity, config.roll, config.dialog, { 
        create: false,
        data: { 
          // rollMsg: msg.content, 
          rolls: [activityRolls[0]],
          user: config.message.user,
          speaker: config.message.speaker,
          flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
                      `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`,
          flags: {
            rsr5e: config.roll.flags.rsr5e,
            [MODULE_SHORT]: { 
              processed: true, 
              data: { msg, msgData },
              rollMode: msgData.rollMode,
              cls: msg.flags["ddb-game-log"].cls,
              flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
                      `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
            }
          }
        }
      });
      

    }

    // usageResults.message.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors({user: game.user});
    usageResults.message.flags = usageResults.message.flags ?? {};
    // usageResults.message.rolls = activityRolls;
    LogUtil.log("triggerAttack - before card", [activityRolls, usageResults.message]);  

    if(!isMidiOn){
      const card = await ChatMessage.implementation.create(usageResults.message, { rollMode: msgData.rollMode });
      LogUtil.log("USAGE RESULTS", [card, usageResults, config.message, selectedActivity.metadata]);
    }
    
    // if(workflow){
    //   workflow.itemCardUuid = card.uuid;
    //   workflow.itemCardId = card.id;
    //   // workflow.attackCardData = card;
    //   workflow.attackRoll = activityRolls[0];
    //   // workflow.processAttackRoll();
    // }

    // set the template back to normal
    selectedActivity.metadata.usage.chatCard = oldTemplate;
  }

  /**
   * If DDB Gamelog message is a damage roll, find the activity
   * and roll the appropriate method to trigger associated automations 
   * @param {Activity} selectedActivity 
   * @param {ChatMessage} msg 
   * @param {object} msgData 
   * @param {object} config 
   * @returns 
   */
  static triggerDamage = async(selectedActivity, msg, msgData, config) => {
    const SETTINGS = getSettings();
    const isMidiOn = GeneralUtil.isModuleOn("midi-qol");
    let usageResults, activityRolls = [], workflow;

    LogUtil.log("triggerDamage", []);

    if(!selectedActivity){
      throw new Error('No associated activity found.');
    }
    workflow = isMidiOn ? selectedActivity.workflow : null;

    if(isMidiOn){
      // if(!selectedActivity.attack){
      //   LogUtil.warn("Damage only roll not implemented");
      // }else{
      //   if(!workflow){
      //     LogUtil.error("Attack workflow not found for damage roll", [selectedActivity]);
      //     return;
      //   }
      //   activityRolls = await selectedActivity.rollDamage({
      //     ...config.roll,
      //     midiOptions: {
      //       workflowOptions: { damageRollDSN: false }
      //     }
      //   }, 
      //   config.dialog, 
      //   { 
      //     create: false,
      //     data: {
      //       ...config.message 
      //     }
      //   });
      //   if(activityRolls.length < 1){ return; }
        
      //   // copy terms from the original roll and recalculate
      //   if(SettingsUtil.get(SETTINGS.foundryRollModifiers.tag)){
      //     activityRolls[0] = RollUtil.replaceDie(activityRolls[0], msg.rolls[0]);
      //   }else{
      //     activityRolls[0] = RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
      //   }

      //   await workflow.setDamageRoll(activityRolls[0]);
      //   await workflow.WorkflowState_DamageRollComplete();
      //   await workflow.setDamageRoll(activityRolls[0]);
      // }

    } else { 
      activityRolls = [];

      if(!selectedActivity.attack){
        LogUtil.log("Damage only activity", [activityRolls, selectedActivity.metadata.usage.chatCard]);
        
        config.roll.subsequentActions = false;
        usageResults = await ActivityUtil.ddbglUse(selectedActivity, config.roll, config.dialog, { 
          create: true,
          rollMode: msgData.rollMode,
          data: { 
            // rollMsg: msg.content, 
            rolls: [],
            user: config.message.user,
            speaker: config.message.speaker,
            flavor: ``,
            flags: {
              rsr5e: config.roll.flags.rsr5e,
              [MODULE_SHORT]: { 
                processed: true, 
                data: { msg, msgData },
                rollMode: msgData.rollMode,
                cls: msg.flags["ddb-game-log"].cls,
                flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
                        `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
              }
            }
          }
        });

        // if(!usageResults){
        //   usageResults = { message: config.message }
        // }
    
        // // usageResults.message.rolls = [activityRolls[0]]; 
        // usageResults.message.flags = usageResults.message.flags ?? {}; 
        // usageResults.message.flags.rsr5e = {
        //   processed: true,
        //   quickRoll: false
        // }
        // usageResults.message.targets = GeneralUtil.getTargetDescriptors();
        // usageResults.message.rollMode = msgData.rollMode;
      }

      try{
        activityRolls = await selectedActivity.rollDamage({
          flags: config.roll.flags,
          consume: config.roll.consume,
          formula: config.roll.formula,
          user: config.roll.user
        }, config.dialog, { 
          create: false,
          data: {
            ...config.message,
            targets: GeneralUtil.getTargetDescriptors(),
            flags: {
              ...config.message.flags,
              dnd5e: {
                ...config.message.flags?.dnd5e,
                targets: GeneralUtil.getTargetDescriptors()
              }
            }
          }
        }); 

        if(activityRolls.length < 1){ return; }
        if(SettingsUtil.get(SETTINGS.foundryRollModifiers.tag)){
          activityRolls[0] = RollUtil.replaceDie(activityRolls[0], msg.rolls[0]);
        }else{
          activityRolls[0] = RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
        }
        LogUtil.log("triggerAttack - after", [activityRolls, msg.rolls]);
        
        config.roll.flags.dnd5e.roll = { type: ROLL_TYPES.damage }; 
        config.message.flags = config.roll.flags;
        config.message.flags = {
          ...config.message,
          dnd5e: {
            ...config.roll.flags.dnd5e,
            targets: GeneralUtil.getTargetDescriptors()
          },
          rsr5e: config.roll.flags.rsr5e
        }; 
      }catch(e){
        LogUtil.error("triggerDamage ERROR", [e]);
      }
      
      await activityRolls[0].toMessage(config.message, {rollMode: msgData.rollMode });


      setTimeout(() => {
        GeneralUtil.removeTemplateForItem(selectedActivity.item);
      }, 3000); 
    }

  }
  
  /**
   * If DDB Gamelog message is an ability test (skill, save, check), trigger the appropriate roll
   * Note: In theory, we could just post the original roll, but we'll 
   * use the appropriate roll method here for compatibility with other modules
   * @param {string} testType 
   * @param {ChatMessage} msg 
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
      config.roll.flags.dnd5e.roll = { 
        type: testType===DDBGL_CLS.check.cls ? ROLL_TYPES.abilityCheck : ROLL_TYPES.abilitySave,
        ability: ability.abbrev
      }; 
    }
    config.message.flags = {
      // ...config.message,
      dnd5e: config.roll.flags.dnd5e,
      rsr5e: config.roll.flags.rsr5e
    };

    // roll attack from activity without creating ChatMessage
    if(testType===DDBGL_CLS.save.cls){
      testRolls = await msgData.actor.rollSavingThrow({ ability: ability?.abbrev }, config.dialog, { create: false }); 
    }else if(testType===DDBGL_CLS.check.cls){
      testRolls = await msgData.actor.rollAbilityCheck({ ability: ability?.abbrev }, config.dialog, { create: false }); 
      LogUtil.log("triggerAbilityTest", [ testRolls, config.message ]); 
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
    const SETTINGS = getSettings();
    let usageResults;
    let activityRolls = [];

    LogUtil.log("Heal activity");

    config.roll.subsequentActions = false;
    config.roll.flags.dnd5e.roll = { type: ROLL_TYPES.damage }; 

    usageResults = await ActivityUtil.ddbglUse(selectedActivity, config.roll, config.dialog, { 
      create: true,
      rollMode: msgData.rollMode,
      data: { 
        // rollMsg: msg.content, 
        rolls: [],
        user: config.message.user,
        speaker: config.message.speaker,
        flavor: ``,
        flags: {
          rsr5e: config.roll.flags.rsr5e,
          [MODULE_SHORT]: { 
            processed: true, 
            data: { msg, msgData },
            rollMode: msgData.rollMode,
            cls: msg.flags["ddb-game-log"].cls,
            flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
                    `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
          }
        }
      }
    })

    // if(!usageResults){
    //   usageResults = { message: config.message }
    // }

    // // usageResults.message.rolls = [activityRolls[0]]; 
    // usageResults.message.flags = usageResults.message.flags ?? {}; 
    // usageResults.message.flags.rsr5e = {
    //   processed: true,
    //   quickRoll: false
    // }
    
    try{
      activityRolls = await selectedActivity.rollDamage({
        flags: config.roll.flags,
        consume: config.roll.consume,
        formula: config.roll.formula,
        user: config.roll.user
      }, config.dialog, { 
        create: false,
        data: {
          ...config.message,
          flags: {
            ...config.message.flags,
            dnd5e: {
              ...config.message.flags?.dnd5e,
              targets: GeneralUtil.getTargetDescriptors()
            }
          }
        }
      }); 

      if(activityRolls.length < 1){ return; }
      if(SettingsUtil.get(SETTINGS.foundryRollModifiers.tag)){
        activityRolls[0] = RollUtil.replaceDie(activityRolls[0], msg.rolls[0]);
      }else{
        activityRolls[0] = RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
      }
      LogUtil.log("triggerHeal - after", [activityRolls, msg.rolls]);
      
      config.message.flags = config.roll.flags;
      config.message.flags = {
        ...config.message,
        dnd5e: {
          ...config.roll.flags.dnd5e,
          targets: GeneralUtil.getTargetDescriptors()
        },
        rsr5e: config.roll.flags.rsr5e
      }; 
    }catch(e){
      LogUtil.error("triggerHeal ERROR", [e]);
    }

    await activityRolls[0].toMessage(config.message, {rollMode: msgData.rollMode });

  }

  /**
   * If DDB Gamelog message is a custom roll, just post it
   * @param {object} config 
   */
  static triggerCustomRoll = async(config, msg, actionName, msgData) => {
    // config.message.flags = config.roll.flags;
    config.message = {
      ...config.message,
      dnd5e: {
        ...config.roll.flags.dnd5e
      },
      rsr5e: config.roll.flags.rsr5e
    };

    // Create message with the provided roll and msg data, without modifications
    await msg.rolls[0].toMessage(config.message, { ...msgData });
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

  static replaceDie(roll, replacer){
    if(!replacer || !roll){ return roll; }
    LogUtil.log("replaceDie", [replacer, roll]);
    
    // Check if replacer.terms exists before trying to filter it
    if (!replacer.terms) {
      LogUtil.error("replaceDie - replacer.terms is undefined", [replacer]);
      return roll;
    }
    
    const replacerDice = replacer.terms.filter(t => t instanceof Die || t.class === 'Die') || [];
    const noDice = roll?.terms?.filter(t => !(t instanceof Die || t.class === 'Die')) || [];
    roll.terms = [...replacerDice, ...noDice];

    roll._total = roll._evaluateTotal();
    roll.resetFormula();
    return roll;
  }

  static getDialogSetting(defaultOption, config){
    const SETTINGS = getSettings();
    const skipConfig = SettingsUtil.get(SETTINGS.skipRollConfig.tag); 
    LogUtil.log("getDialogSetting", ["skip mode: " + skipConfig, Main.keysPressed, config]); 

    if(config.flags?.["ddb-game-log"] !== undefined){ 
      return false; // ddb gamelog is always skipped
    }else{
      switch(skipConfig){ 
        case 1: 
          return Main.keysPressed.indexOf("Shift")==-1 ? false : true; // skip unless shift is pressed
        default:
          return defaultOption;
      }
    }
  
  }
}
