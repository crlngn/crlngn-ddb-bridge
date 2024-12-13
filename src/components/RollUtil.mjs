import { LogUtil } from "./LogUtil.mjs";

export class RollUtil{

  static async fastForwardRoll(rollActivity, config){
    LogUtil.log("RollUtil.fastForwardRoll", [rollActivity, config]);
    config = {
      ...config, 
      dialog: {
        ...config.dialog,
        configure: false
      },
    }


    config.msg = { create: false, data: { cardButtons: config.msg?.data?.content } }; 

    const rolls = await rollActivity.rollAttack(config.usage||{}, config.dialog, config.msg);

    const charName = 'Cat Mantlemourn';
    const tpl = '/modules/crlgn-rolls/templates/action-panel-root.html';
    const html = await renderTemplate(tpl, { charName });
    // config.msg = {...config.msg, create: true}; 
    LogUtil.log("RollUtil.fastForwardRoll template", [html])
  }

  static reviseDDBD20Roll = (originalMsg, activityRolls) => { 
    const originalRoll = originalMsg.rolls?.find((r) => r.faces === 20); 
    const d20Roll = activityRolls?.find((r) => r.faces === 20); 
    // const cloned = d20Roll.clone()

    if(!d20Roll){ 
      return activityRolls; 
    } 

    LogUtil.log("Roll Comparison (original, new)", [originalRoll, newRoll, CONFIG]); 

    let d20TermIndex = -1;
    const d20Term = d20Roll.terms.find((t, i) => {
      if(t.faces === 20){
        d20TermIndex = i;
        return true;
      }
      return false;
    }); 
    // const d20BaseTerm = {...d20Term} as GenericObject;
    if(!d20Term){
      LogUtil.log("? No d20Term", [d20Roll.terms]); 
      return activityRolls; 
    }
    LogUtil.log("d20Term", [d20Term]); 

    originalRoll.terms.forEach((t, i)=>{
      if(t.faces === 20){
        // const term = {...d20Term} as GenericObject;
        
        // const d20Forced = new dnd5e.dice.D20Die({
        //   ...newRoll.terms[d20TermIndex],
        //   number: t.number,
        //   faces: 20,
        //   results: [...t.results],
        //   modifiers: t.modifiers
        // });
        d20Roll.terms[d20TermIndex] = {
          ...d20Roll.terms[d20TermIndex],
          number: t.number,
          faces: 20,
          results: [...t.results],
          modifiers: t.modifiers
        };
        // newRoll.terms[i] = d20Term
        LogUtil.log("TEST roll terms", [d20Roll.terms, t.number]); 
      } 
    });
    
    return [d20Roll];

    //
    /*
    // msg.flags[MODULE_SHORT].isCritical = msg.isCritical || false;
    const msgRoll = msg.rolls?.find(r => r instanceof CONFIG.Dice.D20Roll);
    const cardRoll = await ItemUtil.getAttackFromCard(msg);

    const opTerm = new OperatorTerm({operator: bonus < 0 ? "-" : "+"});
    const bonusTerm = new NumericTerm({number: Math.abs(bonus)});
    LogUtil.log("applyD20Bonus", [cardRoll]); 

    if(msgRoll && cardRoll){
      const baseRoll = msgRoll;
      const revisedRoll = cardRoll;
      revisedRoll.terms = revisedRoll.terms.concat([opTerm, bonusTerm]);
      
      for (const [j, term] of baseRoll.terms.entries()) {
        if (!(term instanceof Die)) {
            continue;
        }
        revisedRoll.terms[j]?.results.splice(0, term.results.length, ...term.results);
      }
      RollUtil.resetRoll(revisedRoll);
      // LogUtil.log("revisedRoll", [msg.rolls.indexOf(baseRoll), msg.rolls, baseRoll]); 
      msg.rolls[msg.rolls.indexOf(baseRoll)] = revisedRoll;
    }

    ChatUtil.updateChatMessage(msg, {
      flags: msg.flags,
      rolls: msg.rolls
    });
    */
  }

  static resetRollGetters(roll) {
    roll._total = roll._evaluateTotal();
    // roll._evaluated = true;
    // roll.resetFormula();
    // return roll;
  }
  // static setDeterministicRolls = (rolls:Roll[]) => {
  //   let revisedRolls = rolls.forEach((r,i) => {
  //     rolls[i].evaluate = false;
  //   })
  // }
}