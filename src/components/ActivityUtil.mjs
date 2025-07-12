import { DDBGL_CLS } from "../constants/DDBGL.mjs";
import { GeneralUtil } from "./GeneralUtil.mjs";
import { LogUtil } from "./LogUtil.mjs";

export class ActivityUtil {

  /**
   * If the item has an associated activity, return it,
   * according to the type of roll passed from DDB Gamelog
   * @param {*} item 
   * @param {*} ddbglCls 
   * @returns 
   */
  static getActivityFromItem(item, ddbglCls){ 
    let selectedActivity = null;
    if(!item){ return selectedActivity };

    const activities = item.system?.activities;
    const hasAttack = item.hasAttack;
    const hasSave = item.hasSave;

    LogUtil.log("getActivityFromItem", [activities, typeof activities, Array.isArray(activities)]); 

    const activityByType = (type) => {
      // const activityList = Object.values(activities);
      const activity = activities.find(act => { 
        return act.type == type;
      });
      LogUtil.log("activityByType", [item, type, activities.size, activity]); 
      return activity;
    }

    switch(ddbglCls){ 
      case DDBGL_CLS.toHit.cls: // attack roll
        selectedActivity = activityByType(DDBGL_CLS.toHit.actionType);
        break;
      case DDBGL_CLS.damage.cls: // damage roll
        if(hasAttack){ // damage from attack roll
          selectedActivity = activityByType(DDBGL_CLS.toHit.actionType);
        }else if(hasSave){ // damage from saving throw
          selectedActivity = activityByType(DDBGL_CLS.save.actionType);
        }else{
          selectedActivity = activityByType(DDBGL_CLS.damage.actionType);
        }
        break;
      case DDBGL_CLS.check.cls:
        selectedActivity = activityByType(DDBGL_CLS.check.actionType);
        break;
      case DDBGL_CLS.save.cls:
        selectedActivity = activityByType(DDBGL_CLS.save.actionType);
        break;
      case DDBGL_CLS.heal.cls:
        selectedActivity = activityByType(DDBGL_CLS.heal.actionType);
        break;
      case DDBGL_CLS.cast.cls:
        selectedActivity = activityByType(DDBGL_CLS.cast.actionType);
        break;
      default:
        //
    }

    return selectedActivity ?? Array.from(activities.keys())[0] ?? null;
  }

  /**
   * Activate this activity. 
   * Like use() from ActivityMixin in dnd5e, but it does not roll attack / damage again
   * @param {Activity} activity
   * @param {ActivityUseConfiguration} usage        Configuration info for the activation.
   * @param {ActivityDialogConfiguration} dialog    Configuration info for the usage dialog.
   * @param {ActivityMessageConfiguration} message  Configuration info for the created chat message.
   * @returns {Promise<ActivityUsageResults|void>}  Details on the usage process if not canceled.
   */
  static async ddbglUse(activity, usage={}, dialog={}, message={}) {
    if(!activity){
      ui.notifications.error("No activity found", { localize: false });
      return;
    }
    if ( !activity.item.isEmbedded || activity.item.pack ) return;
    if ( !activity.item.isOwner ) {
      ui.notifications.error("DND5E.DocumentUseWarn", { localize: true });
      return;
    }
    if ( !activity.canUse ) {
      ui.notifications.error("DND5E.ACTIVITY.Warning.UsageNotAllowed", { localize: true });
      return;
    }

    // Create an item clone to work with throughout the rest of the process
    let item = activity.item.clone({}, { keepId: true });

    const usageConfig = activity._prepareUsageConfig(usage);
    
    if(usageConfig.create?.measuredTemplate){
      ui.notifications?.info("Click the map to place the template and see the roll. Right click to cancel", { localize: false });
    }

    const dialogConfig = foundry.utils.mergeObject({
      configure: true,
      applicationClass: activity.metadata.usage.dialog
    }, dialog);

    const messageConfig = foundry.utils.mergeObject({
      create: true,
      data: {
        flags: {
          dnd5e: {
            ...activity.messageFlags,
            messageType: "usage",
            use: {
              effects: activity.applicableEffects?.map(e => e.id)
            }
          },
          rsr5e: { processed: true, quickRoll: false }
        }
      },
      hasConsumption: usageConfig.hasConsumption
    }, message);

    /**
     * 
     * @function dnd5e.preUseActivity
     * @memberof hookEvents
     * @param {Activity} activity                           Activity being used.
     * @param {ActivityUseConfiguration} usageConfig        Configuration info for the activation.
     * @param {ActivityDialogConfiguration} dialogConfig    Configuration info for the usage dialog.
     * @param {ActivityMessageConfiguration} messageConfig  Configuration info for the created chat message.
     * @returns {boolean}  Explicitly return `false` to prevent activity from being used.
     */
    if ( Hooks.call("dnd5e.preUseActivity", activity, usageConfig, dialogConfig, messageConfig) === false ) return;

    // Display configuration window if necessary
    if ( dialogConfig.configure && activity._requiresConfigurationDialog(usageConfig) ) {
      try {
        await dialogConfig.applicationClass.create(activity, usageConfig, dialogConfig.options);
      } catch(err) {
        return;
      }
    }

    // Handle scaling
    await activity._prepareUsageScaling(usageConfig, messageConfig, item);
    activity = item.system.activities.get(activity.id);

    // Handle consumption
    const updates = await activity.consume(usageConfig, messageConfig);
    if ( updates === false ) return;
    const results = { effects: [], templates: [], updates };

    // Create concentration effect & end previous effects
    if ( usageConfig.concentration?.begin ) {
      const effect = await item.actor.beginConcentrating(activity, { "flags.dnd5e.scaling": usageConfig.scaling });

      if ( effect ) {
        results.effects ??= [];
        results.effects.push(effect);
        foundry.utils.setProperty(messageConfig.data, "flags.dnd5e.use.concentrationId", effect.id);
      }
      if ( usageConfig.concentration?.end ) {
        const deleted = await item.actor.endConcentration(usageConfig.concentration.end);
        results.effects.push(...deleted);
      }
    }


    // Create chat message
    messageConfig.data.rolls = (messageConfig.data.rolls ?? []).concat(updates.rolls);
    

    // activity._finalizeMessageConfig(usageConfig, messageConfig, results);
    results.message = await ActivityUtil.createUsageMessage(activity, messageConfig);

    LogUtil.log("messageConfig", [ messageConfig, results.message]);

    results.message.dnd5e = messageConfig.flags?.dnd5e ?? {};
    results.message.dnd5e.targets = GeneralUtil.getTargetDescriptors({ actorId: results.message.speaker.actor });
    results.message.flags = {
      ...results.message.flags, 
      rsr5e: { processed: true }
    }
    LogUtil.log("ddbglUse", [results.message]);

    // Perform any final usage steps
    await activity._finalizeUsage(usageConfig, results); 

    if ( Hooks.call("dnd5e.postUseActivity", activity, usageConfig, results) === false ) return results;

    // Trigger any primary action provided by this activity
    if(usageConfig.subsequentActions !== false){
      activity._triggerSubsequentActions(usageConfig, results);
    }

    return results; 
  }

  // static async use(usage={}, dialog={}, message={}) {
  //   if ( !this.item.isEmbedded || this.item.pack ) return;
  //   if ( !this.item.isOwner ) {
  //     ui.notifications.error("DND5E.DocumentUseWarn", { localize: true });
  //     return;
  //   }
  //   if ( !this.canUse ) {
  //     ui.notifications.error("DND5E.ACTIVITY.Warning.UsageNotAllowed", { localize: true });
  //     return;
  //   }

  //   // Create an item clone to work with throughout the rest of the process
  //   let item = this.item.clone({}, { keepId: true });
  //   let activity = item.system.activities.get(this.id);

  //   const usageConfig = activity._prepareUsageConfig(usage);

  //   const dialogConfig = foundry.utils.mergeObject({
  //     configure: true,
  //     applicationClass: this.metadata.usage.dialog
  //   }, dialog);

  //   const messageConfig = foundry.utils.mergeObject({
  //     create: true,
  //     data: {
  //       flags: {
  //         dnd5e: {
  //           ...this.messageFlags,
  //           messageType: "usage",
  //           use: {
  //             effects: this.applicableEffects?.map(e => e.id)
  //           }
  //         }
  //       }
  //     },
  //     hasConsumption: usageConfig.hasConsumption
  //   }, message);

  //   /**
  //    * A hook event that fires before an activity usage is configured.
  //    * @function dnd5e.preUseActivity
  //    * @memberof hookEvents
  //    * @param {Activity} activity                           Activity being used.
  //    * @param {ActivityUseConfiguration} usageConfig        Configuration info for the activation.
  //    * @param {ActivityDialogConfiguration} dialogConfig    Configuration info for the usage dialog.
  //    * @param {ActivityMessageConfiguration} messageConfig  Configuration info for the created chat message.
  //    * @returns {boolean}  Explicitly return `false` to prevent activity from being used.
  //    */
  //   if ( Hooks.call("dnd5e.preUseActivity", activity, usageConfig, dialogConfig, messageConfig) === false ) return;

  //   // Display configuration window if necessary
  //   if ( dialogConfig.configure && activity._requiresConfigurationDialog(usageConfig) ) {
  //     try {
  //       await dialogConfig.applicationClass.create(activity, usageConfig, dialogConfig.options);
  //     } catch(err) {
  //       return;
  //     }
  //   }

  //   // Handle scaling
  //   await activity._prepareUsageScaling(usageConfig, messageConfig, item);
  //   activity = item.system.activities.get(this.id);

  //   // Handle consumption
  //   const updates = await activity.consume(usageConfig, messageConfig);
  //   if ( updates === false ) return;
  //   const results = { effects: [], templates: [], updates };

  //   // Create concentration effect & end previous effects
  //   if ( usageConfig.concentration?.begin ) {
  //     const effect = await item.actor.beginConcentrating(activity, { "flags.dnd5e.scaling": usageConfig.scaling });
  //     if ( effect ) {
  //       results.effects ??= [];
  //       results.effects.push(effect);
  //       foundry.utils.setProperty(messageConfig.data, "flags.dnd5e.use.concentrationId", effect.id);
  //     }
  //     if ( usageConfig.concentration?.end ) {
  //       const deleted = await item.actor.endConcentration(usageConfig.concentration.end);
  //       results.effects.push(...deleted);
  //     }
  //   }

  //   // Create chat message
  //   activity._finalizeMessageConfig(usageConfig, messageConfig, results);
  //   results.message = await activity._createUsageMessage(messageConfig);

  //   // Perform any final usage steps
  //   await activity._finalizeUsage(usageConfig, results);

  //   /**
  //    * A hook event that fires when an activity is activated.
  //    * @function dnd5e.postUseActivity
  //    * @memberof hookEvents
  //    * @param {Activity} activity                     Activity being activated.
  //    * @param {ActivityUseConfiguration} usageConfig  Configuration data for the activation.
  //    * @param {ActivityUsageResults} results          Final details on the activation.
  //    * @returns {boolean}  Explicitly return `false` to prevent any subsequent actions from being triggered.
  //    */
  //   if ( Hooks.call("dnd5e.postUseActivity", activity, usageConfig, results) === false ) return results;

  //   // Trigger any primary action provided by this activity
  //   if ( usageConfig.subsequentActions !== false ) {
  //     activity._triggerSubsequentActions(usageConfig, results);
  //   }

  //   return results;
  // }

  /* -------------------------------------------- */
  /**
   * Display a chat message for this usage.
   * @param {Activity} activity
   * @param {ActivityMessageConfiguration} message  Configuration for the message
   * @returns {Promise<ChatMessage5e|object>}
   * @protected
   */
  static async createUsageMessage(activity, message) {
    let context = await activity._usageChatContext(message);
    // context.rollMsg = message.data.rollMsg;
    let rollData = await _buildRollData(message.data.rolls, activity);
    context = {
      ...context,
      rolls: rollData
    }
    
    LogUtil.log("createUsageMessage", [activity.metadata.usage.chatCard, context]); 

    const messageConfig = foundry.utils.mergeObject({
      rollMode: game.settings.get("core", "rollMode"),
      data: {
        content: await renderTemplate(activity.metadata.usage.chatCard, context),
        speaker: ChatMessage.getSpeaker({ actor: activity.item.actor }),
        flags: {
          core: { canPopout: true },
          rsr5e: { processed: true }
        }
      }
    }, message);

    Hooks.callAll("dnd5e.preCreateUsageMessage", activity, messageConfig);

    ChatMessage.applyRollMode(messageConfig.data, messageConfig.rollMode);
    const card = messageConfig.create === false ? messageConfig.data : await ChatMessage.create(messageConfig.data);

    Hooks.callAll("dnd5e.postCreateUsageMessage", activity, card);

    return card;
  }
}

const _buildRollData = async(rolls, activity) => {
  let rollData = [];

  rollData = await Promise.all(rolls.map(async(r)=>{
    const tooltipHtml = await r.getTooltip();
    // Check if roll has a target and determine success/failure
    const hasTarget = Number.isNumeric(r.options?.target);
    const isSuccess = hasTarget && r.total >= r.options.target;
    const isFailure = hasTarget && r.total < r.options.target;
    
    return {
      ...r,
      formula: r.formula,
      total: r.total,
      tooltipHtml: tooltipHtml,
      isSuccess: isSuccess,
      isFailure: isFailure,
      hasTarget: hasTarget
    }
  }));
  // LogUtil.log("_buildRollData / rollData",[rollData]);

  return rollData
}