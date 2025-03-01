import { LogUtil } from "./LogUtil.mjs";
import { ActivityUtil } from  "./ActivityUtil.mjs";
import { GeneralUtil } from "./GeneralUtil.mjs";
import { DDBGL_CLS } from "../constants/DDBGL.mjs";
import { MODULE_SHORT, ROLL_TYPES } from "../constants/General.mjs";
import ChatMessage5e from "../../dnd5e/module/documents/chat-message.mjs";
import { SettingsUtil } from "./SettingsUtil.mjs";
import { getSettings } from "../constants/Settings.mjs";
import { Main } from "./Main.mjs";

export class RollUtil{
  // ddbglCls, itemId, actionName, msg, msgConfig
  static streamlineDDBRoll = async (ddbglCls, itemId, actionName, msg, msgData) => {
    let selectedActivity = null, castActivity = null;
    let user = game.user;
    let item = actionName ? GeneralUtil.findItemFromActor(msgData.speaker.actor, itemId, actionName) : null;

    msg.rolls = msg.rolls.map(rollData => Roll.fromJSON(rollData));
    
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
      formula: originalRoll.formula,
      consume: { resources: false, spellSlot: false },
      user: user,
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
   * @param {ChatMessage5e} msg 
   * @param {object} msgData 
   * @returns 
   */
  static triggerAttack  = async(selectedActivity, msg, msgData, config) => {
    const SETTINGS = getSettings();
    let usageResults, activityRolls, workflow;
    let oldTemplate;
    if(!selectedActivity){ throw new Error('No associated activity found.') }

    // config specific to attack rolls
    config.roll.flags.rsr5e = { processed: true  };
    config.roll.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors({user: config.message.user}); 
    config.roll.flags.dnd5e.roll = { type: ROLL_TYPES.attack }; 

    LogUtil.log("triggerAttack", [config, selectedActivity]);
    // return;
    const isMidiOn = GeneralUtil.isModuleOn("midi-qol");
    LogUtil.log("triggerAttack - isMidiOn", [isMidiOn, selectedActivity, usageResults]);
    if(isMidiOn){
      // // set the template for the chat message
      // oldTemplate = selectedActivity.metadata.usage.chatCard;
      // selectedActivity.metadata.usage.chatCard = `modules/${MODULE_SHORT}/templates/ddb-attack-info.hbs`;
      // workflow = new MidiQOL.Workflow(selectedActivity.actor, selectedActivity, msg.speaker, config.message.user.targets, 
      //   { 
      //     // rolls: msg.rolls,
      //     // itemCardUuid: usageResults.message.uuid,
      //     // itemCardId: usageResults.message.id,
      //     // showCard: false
      //   }
      // ); 
      const workflow = new MidiQOL.Workflow(selectedActivity.actor, selectedActivity, msg.speaker, config.message.user.targets, { 
        workflowOptions: { attackRollDSN: false }
      });

      activityRolls = await selectedActivity.rollAttack({
        ...config.roll,
        midiOptions: {
          workflowOptions: { attackRollDSN: false }
        }
      }, 
      config.dialog, 
      { 
        create: false,
        data: {
          ...config.message 
        }
      });

      if(activityRolls.length < 1){ return; }
      
      // copy terms from the original roll and recalculate
      if(SettingsUtil.get(SETTINGS.foundryRollModifiers.tag)){
        RollUtil.replaceDie(activityRolls[0], msg.rolls[0]);
      }else{
        RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
      }

      usageResults = await selectedActivity.use({
        ...config.roll,
        // midiOptions: {
        //   workflowOptions: { attackRollDSN: true }
        // }
      }, config.dialog, { 
        create: true,
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
      workflow.setAttackRoll(activityRolls[0]);

      /*
      usageResults = await selectedActivity.use({
        ...config.roll,
        midiOptions: {
          workflowOptions: { attackRollDSN: false }
        }
      }, { configure:false }, { 
        create: true,
        data: { 
          rollMsg: msg.content, 
          rolls: [msg.rolls[0]],
          // rolls: [activityRolls[0]],
          user: config.message.user,
          speaker: config.message.speaker,
          flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
                      `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`,
          flags: {
            rsr5e: config.roll.flags.rsr5e,
            [MODULE_SHORT]: { 
              processed: true, 
              data: { msg, msgData, config },
              rollMode: msgData.rollMode,
              cls: msg.flags["ddb-game-log"].cls,
              flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
                      `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
            }
          }
        }
      });
      workflow = selectedActivity.workflow;

      // activityRolls = await selectedActivity.rollAttack(config.roll, config.dialog, { 
      //   create: false,
      //   data: {
      //     ...config.message,
      //     flags: {
      //       rsr5e: config.roll.flags.rsr5e,
      //       [MODULE_SHORT]: { 
      //         processed: true, 
      //         data: { msg, msgData, config },
      //         rollMode: msgData.rollMode,
      //         cls: msg.flags["ddb-game-log"].cls,
      //         flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
      //                 `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
      //       }
      //     }
      //   }
      // });

      // copy terms from the original roll and recalculate
      // RollUtil.replaceDie(activityRolls[0], msg.rolls[0]);
      
      workflow = selectedActivity.workflow;
      RollUtil.replaceDie(workflow.attackRoll, msg.rolls[0]);

      //MidiQOL.Workflow.getWorkflow(selectedActivity.uuid);

      // if (workflow?.suspended) workflow.unSuspend.bind(workflow)({ attackRoll:  activityRolls[0] });
      // if (workflow?.suspended) workflow.unSuspend.bind(workflow)({ attackRoll:  msg.rolls[0] });
      LogUtil.log("triggerAttack - workflow", [workflow.chatCard, workflow.itemCardUuid, MidiQOL.debouncedUpdate]);
      MidiQOL.debouncedUpdate(workflow.chatCard, { rolls: [workflow.attackRoll]})

      // activityRolls = await selectedActivity.rollAttack({ midiOptions: { fastForward: true, chatMessage: false, isDummy: true } }, {}, {});
      // if(activityRolls.length < 1){ return; }
     */

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

      // copy terms from the original roll and recalculate
      if(SettingsUtil.get(SETTINGS.foundryRollModifiers.tag)){
        RollUtil.replaceDie(activityRolls[0], msg.rolls[0]);
      }else{
        RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);
      }

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

    usageResults.message.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors({user: config.message.user});
    usageResults.message.flags = usageResults.message.flags ?? {};
    usageResults.message.rolls = activityRolls;
    LogUtil.log("triggerAttack - before card", [activityRolls, usageResults.message]);  

    if(!isMidiOn){
      const card = await ChatMessage5e.create(usageResults.message, { rollMode: msgData.rollMode });
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
    if(!isMidiOn){
      selectedActivity.metadata.usage.chatCard = oldTemplate;
    }
  }
  // static triggerAttack  = async(selectedActivity, msg, msgData, config) => {
  //   let usageResults, workflow;
  //   if(!selectedActivity){ throw new Error('No associated activity found.') }

  //   // config specific to attack rolls
  //   config.roll.flags.rsr5e = { processed: true  };
  //   config.roll.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors({user: config.message.user}); 
  //   config.roll.flags.dnd5e.roll = { type: ROLL_TYPES.attack }; 
  //   // config.roll.flags.dnd5e.activity = {
  //   //   ...config.roll.flags.dnd5e.activity,
  //   //   type: ROLL_TYPES.attack
  //   // }
  //   // config.message.flags = config.roll.flags;

  //   LogUtil.log("triggerAttack", [config, selectedActivity]);

  //   // return;
  //   const isMidiOn = GeneralUtil.isModuleOn("midi-qol");
  //   LogUtil.log("triggerAttack - isMidiOn", [isMidiOn, MidiQOL, selectedActivity, usageResults]);
  //   if(isMidiOn){
  //     workflow = new MidiQOL.Workflow(selectedActivity.actor, selectedActivity, msg.speaker, config.message.user.targets, 
  //       { 
  //         rolls: msg.rolls,
  //         // itemCardUuid: usageResults.message.uuid
  //       }
  //     );
  //     LogUtil.log("triggerAttack - workflow", [workflow]);
  //   }

  //   let activityRolls = await selectedActivity.rollAttack(config.roll, config.dialog, { 
  //     create: false,
  //     data: {
  //       ...config.message 
  //     }
  //   });
  //   if(activityRolls.length < 1){ return; }

  //   // copy terms from the original roll and recalculate
  //   RollUtil.replaceTerms(activityRolls[0], msg.rolls[0]);

  //   // set the template for the chat message
  //   const oldTemplate = selectedActivity.metadata.usage.chatCard;
  //   selectedActivity.metadata.usage.chatCard = `modules/${MODULE_SHORT}/templates/ddb-attack-info.hbs`;

  //   // usageResults.message.user = config.message.user;
  //   usageResults = await ActivityUtil.ddbglUse(selectedActivity, config.roll, config.dialog, { 
  //     create: false,
  //     data: { 
  //       rollMsg: msg.content, 
  //       // rolls: msg.rolls,
  //       user: config.message.user,
  //       speaker: config.message.speaker,
  //       flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
  //                   `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`,
  //       flags: {
  //         rsr5e: config.roll.flags.rsr5e,
  //         [MODULE_SHORT]: { 
  //           processed: true, 
  //           rollMode: msgData.rollMode,
  //           cls: msg.flags["ddb-game-log"].cls,
  //           flavor: `<span class="crlngn item-name">${selectedActivity.item.name}:</span> ` +
  //                   `<span class="crlngn ${msg.flags["ddb-game-log"].cls.replace(" ", "")}">${msg.flags["ddb-game-log"].cls}</span>`
  //         }
  //       }
  //     }
  //   });
  //   usageResults.message.rolls = msg.rolls;
  //   usageResults.message.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors({user: config.message.user});
  //   usageResults.message.flags = usageResults.message.flags ?? {};

  //   if(workflow){
  //     workflow.itemCardUuid = usageResults.message.uuid;
  //   }
    
  //   LogUtil.log("USAGE RESULTS", [usageResults, config.message, selectedActivity.metadata]);

  //   await ChatMessage5e.create(usageResults.message, {rollMode: msgData.rollMode });
  //   // await ChatMessage5e.create(usageResults.message, {rollMode: msgData.rollMode });
  //   // await activityRolls[0].toMessage(config.message, {rollMode: msgData.rollMode });

  //   // set the template back to normal
  //   selectedActivity.metadata.usage.chatCard = oldTemplate;
  // }

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
      await ChatMessage5e.create(usageResults.message, {rollMode: msgData.rollMode }); 
    }
    LogUtil.log("triggerDamage", [config, selectedActivity])

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

    config.roll.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors({user: config.message.user});
    config.roll.flags.dnd5e.roll = { type: ROLL_TYPES.damage }; 
    config.message.flags = config.roll.flags;
    config.message.flags = {
      ...config.message,
      dnd5e: config.roll.flags.dnd5e,
      rsr5e: config.roll.flags.rsr5e
    };

    // await ChatMessage5e.create(config.message, {rollMode: msgData.rollMode }); 
    await activityRolls[0].toMessage(config.message, {rollMode: msgData.rollMode });
    
    if(!selectedActivity.attack){
      config.message.user.targets.forEach(token => { 
        // if(token.actor.testUserPermission(config.message.user, "OWNER")){ 
        token.control({releaseOthers: false})
        // } 
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
    config.roll.flags.dnd5e.roll = { type: ROLL_TYPES.healing };
    config.roll.flags.dnd5e.targets = GeneralUtil.getTargetDescriptors({user: config.message.user});
    // config.message.flags = config.roll.flags;
    config.message.flags = {
      ...config.message,
      dnd5e: config.roll.flags.dnd5e,
      rsr5e: config.roll.flags.rsr5e
    };

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
        ...config.roll.flags.dnd5e,
        // roll: { 
        //   ...config.roll.flags.dnd5e.roll,
        //   type: ROLL_TYPES.custom
        // }
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
    // roll.terms.forEach(term => {
    //   LogUtil.log("replaceTerms", [term])
    // })
    roll._total = roll._evaluateTotal();
    roll.resetFormula();
    return roll;
  }

  static replaceDie(roll, replacer){
    // roll.terms = replacer.terms;
    // const rollDice = roll.terms.filter(t=>t instanceof Die);
    const replacerDice = replacer.terms.filter(t=>t instanceof Die);
    const noDice = roll.terms.filter(t=>!(t instanceof Die));
    roll.terms = [...replacerDice, ...noDice];

    roll._total = roll._evaluateTotal();
    roll.resetFormula();
    LogUtil.log("replaceDie", [roll.formula, roll.terms, replacer.terms]);
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
