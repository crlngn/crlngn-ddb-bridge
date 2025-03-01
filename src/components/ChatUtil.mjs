import { ROLL_TYPES } from "../constants/General.mjs";
import { getSettings } from "../constants/Settings.mjs";
import "../styles/chat.css"
import { LogUtil } from "./LogUtil.mjs";
import { SettingsUtil } from "./SettingsUtil.mjs";

export class ChatUtil {

  static enrichCard(chatMessage, html){
    const SETTINGS = getSettings();
    html.classList.remove('ddb-game-log-open-card');
  
    if(SettingsUtil.get(SETTINGS.enableChatStyles.tag)){ 
      const rollType = chatMessage.flags?.dnd5e?.activity?.type || chatMessage.flags?.dnd5e?.roll?.type || "custom";
      let elem = html.get ? html.get(0) : html;

      const locBtnPath = 'CRLNGN_UI.dnd5e.chatCard.buttons';
      elem.style.setProperty('--crlngn-i18n-attack', game.i18n.localize(`${locBtnPath}.attack`));
      elem.style.setProperty('--crlngn-i18n-damage', game.i18n.localize(`${locBtnPath}.damage`));
      elem.style.setProperty('--crlngn-i18n-summons', game.i18n.localize(`${locBtnPath}.summons`));
      elem.style.setProperty('--crlngn-i18n-healing', game.i18n.localize(`${locBtnPath}.healing`));
      elem.style.setProperty('--crlngn-i18n-template', game.i18n.localize(`${locBtnPath}.template`));
      elem.style.setProperty('--crlngn-i18n-consume', game.i18n.localize(`${locBtnPath}.consume`));
      elem.style.setProperty('--crlngn-i18n-refund', game.i18n.localize(`${locBtnPath}.refund`));
      elem.style.setProperty('--crlngn-i18n-macro', game.i18n.localize(`${locBtnPath}.macro`));
      elem.style.setProperty('--crlngn-i18n-save-dc', game.i18n.localize(`${locBtnPath}.savedc`));
      elem.classList.add('crlngn');
      elem.classList.add(rollType);      
    }    
    if(chatMessage.flags?.["ddb-game-log"]){
      html.classList.add('ddbgl');
    }
  }

  /**
   * Makes default Foundry messages have flavor styling 
   * similar to DDB Gamelog messages
   */
  static formatFlavorText(flavorText, chatMessage, rollType){
    const actor = game.actors.get(chatMessage.speaker?.actor || "") || null;
    const item = actor?.items.get(chatMessage.flags?.dnd5e?.item?.id || "") || null;
    let newFlavor = flavorText || "Message";
    
    if(rollType===ROLL_TYPES.attack){
      LogUtil.log("renderChatMessage", [actor, item]);
      if(item){ 
        newFlavor = `<span class="item-name">` + item?.name;
        newFlavor = newFlavor + `:</span> <span class="tohit">To Hit</span>`;
      }
    }else if(rollType===ROLL_TYPES.damage){
      LogUtil.log("renderChatMessage", [actor, item]);
      if(item){
        newFlavor = `<span class="item-name">` + item?.name;
        newFlavor = newFlavor + `:</span> <span class="damage">Damage</span>`;
      }
    }else if(rollType===ROLL_TYPES.healing){
      LogUtil.log("renderChatMessage", [actor, item]);
      if(item){
        newFlavor = `<span class="item-name">` + (item?.name ?? "Action");
        newFlavor = newFlavor + `:</span> <span class="heal">Heal</span>`;
      }
    }else if(flavorText.includes("Skill Check")){
      newFlavor = `<span class="item-name">` + flavorText;
      newFlavor = newFlavor.replace("Skill Check",`:</span> <span class="check">Check</span>`);
    }else if(flavorText.includes("Ability Check")){
      newFlavor = `<span class="item-name">` + flavorText;
      newFlavor = newFlavor.replace("Ability Check",`:</span> <span class="check">Check</span>`);
    }else if(flavorText.includes("Saving Throw")){
      newFlavor = `<span class="item-name">` + flavorText;
      newFlavor = newFlavor.replace("Saving Throw",`:</span> <span class="save">Save</span>`);
    }else if((rollType==="tool" || rollType==="check") && flavorText.includes("Check")){
      newFlavor = `<span class="item-name">` + flavorText;
      newFlavor = newFlavor.replace("Check",`:</span> <span class="check">Check</span>`);
    }else if(item){
      newFlavor = `<span class="item-name">${item.type}</span>`;
    }else if(!newFlavor){
      newFlavor = `<span class="item-name">Info</span>`;
    }

    return newFlavor;
  }
}