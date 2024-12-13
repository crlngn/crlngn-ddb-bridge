import { DDBGL_CLS } from "../constants/DDBGL.mjs";
import { ACTIVITY_TYPES, MODULE_SHORT, ROLL_TYPES } from "../constants/General.mjs";
import { GeneralUtil } from "./GeneralUtil.mjs";
import { LogUtil } from "./LogUtil.mjs";
import { RollUtil } from "./RollUtil.mjs";

export class ActivityUtil {

  static init(){

  }
  /**
   * 
   **/
  static forwardAction = async (ddbglCls, activities, msg, msgConfig) => {
    let activityArray = [];
    let selectedActivity = null;
    LogUtil.log("forwardAction", [{...msg}, msgConfig]); 
    let originalRoll, dialogConfig, rollConfig, activityRolls, rollData;


    // find the appropriate activity according to the roll description from DDB Gamelog
    switch(ddbglCls){ 
      case DDBGL_CLS.toHit.label: // is attack
        selectedActivity = activities.find( act => act.type === DDBGL_CLS.toHit.activityType );

        originalRoll = msg.rolls[0];

        dialogConfig = {
          configure:false
        };

        rollConfig = {
          rolls: [originalRoll],
          formula: originalRoll.formula,
          flags: {
            ...msg.flags,
            [MODULE_SHORT]: {
              originalRoll: [originalRoll],
              temporary: true
            },
            dnd5e: {
              ...msg.flags.dnd5e,
              messageType: "roll",
              roll: { type: "attack" },
              targets: GeneralUtil.getTargetDescriptors()
            }
          }
        }
        activityRolls = await selectedActivity.rollAttack(rollConfig, dialogConfig, { create: false });
        
        // delete msg.flags['ddb-game-log'];

        activityRolls[0].terms = originalRoll.terms;
        /*activityRolls[0].terms.map((t,i)=>{
          let term = t;
          term.evaluated = true;
          if(term instanceof Die){
            term = originalRoll.terms[i];
            term._formula = originalRoll.terms[i].formula;
            term.results = originalRoll.terms[i].results;
            term._evaluateSync({strict: false});
            // term.resetFormula();
          }
          return term;
        });*/
        
        activityRolls[0]._total = activityRolls[0]._evaluateTotal();
        activityRolls[0].resetFormula();

        rollData = {
          rolls: activityRolls,
          formula: activityRolls[0].formula,
          flavor: msg.flavor,
          speaker: msg.speaker,
          whisper: msg.whisper,
          user: game.user,
          blind: msg.blind,
          flags: {
            ...msg.flags,
            [MODULE_SHORT]: {
              originalRoll: [originalRoll]
            },
            dnd5e: {
              ...msg.flags.dnd5e,
              messageType: "roll",
              roll: { type: "attack" },
              targets: GeneralUtil.getTargetDescriptors()
            }
          }
        }

        await activityRolls[0].toMessage(rollData);
        break; 
      case DDBGL_CLS.damage.label: // is damage roll
        selectedActivity = activities.find( act => act.type === DDBGL_CLS.toHit.activityType );
        LogUtil.log("forwardAction - " + DDBGL_CLS.damage.label, [msg.rolls]);

        originalRoll = msg.rolls[0];

        dialogConfig = {
          configure:false
        };

        rollConfig = {
          // class: 'DamageRoll',
          rolls: [originalRoll],
          flags: {
            ...msg.flags,
            [MODULE_SHORT]: {
              originalRoll: [originalRoll],
              temporary: true
            },
            dnd5e: {
              ...msg.flags.dnd5e,
              messageType: "roll",
              roll: { type: "damage" },
              targets: GeneralUtil.getTargetDescriptors(),
              scaling: msg.flags.dnd5e?.scaling ?? 0
            }
          },
          isCritical: msg.flags['ddb-game-log']?.isCritical ?? false,
          scaling: msg.flags.dnd5e?.scaling ?? 0
        }

        dialogConfig = { 
            configure: false 
        }

        LogUtil.log("DamageRoll", [game.dnd5e.dice.DamageRoll]);
        activityRolls = await selectedActivity.rollDamage({
          isCritical:rollConfig.isCritical, scaling: rollConfig.scaling
        }, dialogConfig, { 
          create: false, data: { flags: rollConfig.flags } 
        });
        

        // delete msg.flags['ddb-game-log'];
        activityRolls[0].terms = originalRoll.terms;
        /*
        activityRolls[0].terms.map((t,i)=>{
          let term = t;
          if(term instanceof Die){
            term._formula = originalRoll.terms[i].formula;
            term.results = originalRoll.terms[i].results;
            term._evaluateSync({strict: false});
            // term.resetFormula();
            LogUtil.log('TERM', [DiceTerm, term])
          }
          term.evaluated = true;
          return term;
        });
        */
        
        activityRolls[0]._total = activityRolls[0]._evaluateTotal();
        activityRolls[0].resetFormula();

        rollData = {
          rolls: activityRolls,
          formula: activityRolls[0].formula,
          flavor: msg.flavor,
          speaker: msg.speaker,
          whisper: msg.whisper,
          user: game.user,
          blind: msg.blind,
          flags: {
            ...msg.flags,
            [MODULE_SHORT]: {
              originalRoll: [originalRoll]
            },
            dnd5e: {
              ...msg.flags.dnd5e,
              messageType: "roll",
              roll: { type: "damage" },
              targets: GeneralUtil.getTargetDescriptors()
            }
          }
        }

        await activityRolls[0].toMessage(rollData);
        LogUtil.log("forwardAction - " + DDBGL_CLS.damage, [rollData]);
        break;
      default: 
        // 
    } 

    // if no matching activity was found, use the first one on the list 
    if(!selectedActivity){ 
      activityArray = Array.from(activities); 
      return activityArray[0] || null; 
    } 

    return selectedActivity; 
  } 

  /**
   * 
   * @param {Activity} rollActivity 
   * @param {*} config {usage?, dialog?, msg?}
   */
  static async fastForwardActivity(rollActivity, config){
    config = {
      ...config,
      dialog: {
        ...config.dialog,
        configure: false
      },
      msg: {
        ...config.msg, 
        create: true
      }
    }

    LogUtil.log("RollUtil.fastForwardActivity", [rollActivity.type, config]);

    switch(rollActivity.type){
      case ACTIVITY_TYPES.attack:
        const rolls = await rollActivity.rollAttack(config.usage||{}, config.dialog||{}, config.msg||{});
        LogUtil.log("ActivityUtil.fastForwardActivity - rolls", [rolls]); 
        break;
      default:
        //
        LogUtil.log("ActivityUtil.fastForwardActivity - Activity not configured", []); 
    }
  }

  /*
  static setRenderFlags = (activity:Activity, message:GenericObject) => {
    if (!message.data.flags || !message.data.flags[MODULE_SHORT]) {
        return;
    }
    
    if (!message.data.flags[MODULE_SHORT].quickRoll) {
        return;
    }        

    const hasAttack = activity.hasOwnProperty(ROLL_TYPES.attack);
    const hasDamage = activity.hasOwnProperty(ROLL_TYPES.damage);
    const hasHealing = activity.hasOwnProperty(ROLL_TYPES.healing);
    const hasFormula = activity.hasOwnProperty(ROLL_TYPES.formula);

    if (hasAttack) {            
      message.data.flags[MODULE_SHORT].renderAttack = true;
    }

    if (hasDamage && activity[ROLL_TYPES.damage]?.parts?.length > 0) {
        message.data.flags[MODULE_SHORT].renderDamage = !message.data.flags[MODULE_SHORT].manualDamage;
    }

    if (hasHealing) {
        message.data.flags[MODULE_SHORT].isHealing = true;
        message.data.flags[MODULE_SHORT].renderDamage = true; 
    }

    if (hasFormula && activity[ROLL_TYPES.formula]?.formula !== '') {
        message.data.flags[MODULE_SHORT].renderFormula = true;

        if (activity.roll?.name && activity.roll.name !== "") {
            message.data.flags[MODULE_SHORT].formulaName = activity.roll?.name;
        }
    }
  }
  */


}


/**
 * 
 **/
const forwardAction = (ddbglCls, activities, config) => {
  let activityArray = [];
  let selectedActivity = null;
  
  // find the appropriate activity according to the roll description from DDB Gamelog
  switch(ddbglCls){ 
    case DDBGL_CLS.toHit.label: // is attack
      selectedActivity = activities.find( act => act.type === DDBGL_CLS.toHit.activityType );
      ActivityUtil.fastForwardActivity(selectedActivity, {  });
      LogUtil.log("getActivityFromAction");
      break; 
    case DDBGL_CLS.damage.label: // is attack damage
      selectedActivity = activities.find( act => act.type === DDBGL_CLS.toHit.activityType );
      ActivityUtil.fastForwardActivity(selectedActivity, { });
      LogUtil.log("getActivityFromAction");
    default: 
      // 
  } 

  // if no matching activity was found, use the first one on the list 
  if(!selectedActivity){ 
    activityArray = Array.from(activities); 
    return activityArray[0] || null; 
  } 

  return selectedActivity; 
} 
