// import { ROLL_TYPES } from "../constants/General.mjs";
import { getSettings } from "../constants/Settings.mjs";
import "../styles/chat.css"
import { LogUtil } from "./LogUtil.mjs";
import { SettingsUtil } from "./SettingsUtil.mjs";

export class ChatUtil {
  static chatMsgSettings;

  static init(){
    const SETTINGS = getSettings();
    ChatUtil.chatMsgSettings = SettingsUtil.get(SETTINGS.enableChatStyles.tag);
  }

  static enrichCard(chatMessage, html){
    // const SETTINGS = getSettings();
    if (!html) {
      LogUtil.warn("ChatUtil.enrichCard: html element is null", [chatMessage]);
      return;
    }
    
    LogUtil.log("enrichCard", [chatMessage, html]); 
    html.classList.remove('ddb-game-log-open-card');

    const chatStyles = ChatUtil.chatMsgSettings;

    if(chatStyles){ 
      const rollType = chatMessage.flags?.dnd5e?.activity?.type || chatMessage.flags?.dnd5e?.roll?.type || "custom";
      let elem = html.get ? html.get(0) : html;

      elem.classList.add('crlngn');
      elem.classList.add(rollType);

      if(chatStyles.flags?.["ddb-game-log"]){
        html.classList.add('ddbgl');
      }

      const saveButtons = elem.querySelectorAll('.card-buttons button[data-action=rollSave]');
      if (saveButtons.length > 0) {      
        saveButtons.forEach(button => {
          const visibleDCSpan = button.querySelector('.visible-dc');
          const hiddenDCSpan = button.querySelector('.hidden-dc');

          if (visibleDCSpan) {
            visibleDCSpan.setAttribute('data-ability', button.getAttribute('data-ability') || "");
            visibleDCSpan.setAttribute('data-dc', button.getAttribute('data-dc') || "");
          }
          if (hiddenDCSpan) {
            hiddenDCSpan.setAttribute('data-ability', button.getAttribute('data-ability') || "");
          }
        });
      }
  
    }  
  }

  // /**
  //  * Makes default Foundry messages have flavor styling 
  //  * similar to DDB Gamelog messages
  //  */
  // static formatFlavorText(flavorText, chatMessage, rollType){
  //   const actor = game.actors.get(chatMessage.speaker?.actor || "") || null;
  //   const item = actor?.items.get(chatMessage.flags?.dnd5e?.item?.id || "") || null;
  //   let newFlavor = flavorText || "Message";
    
  //   if(rollType===ROLL_TYPES.attack){
  //     LogUtil.log("renderChatMessage", [actor, item]);
  //     if(item){ 
  //       newFlavor = `<span class="item-name">` + item?.name;
  //       newFlavor = newFlavor + `:</span> <span class="tohit">To Hit</span>`;
  //     }
  //   }else if(rollType===ROLL_TYPES.damage){
  //     LogUtil.log("renderChatMessage", [actor, item]);
  //     if(item){
  //       newFlavor = `<span class="item-name">` + item?.name;
  //       newFlavor = newFlavor + `:</span> <span class="damage">Damage</span>`;
  //     }
  //   }else if(rollType===ROLL_TYPES.healing){
  //     LogUtil.log("renderChatMessage", [actor, item]);
  //     if(item){
  //       newFlavor = `<span class="item-name">` + (item?.name ?? "Action");
  //       newFlavor = newFlavor + `:</span> <span class="heal">Heal</span>`;
  //     }
  //   }else if(flavorText.includes("Skill Check")){
  //     newFlavor = `<span class="item-name">` + flavorText;
  //     newFlavor = newFlavor.replace("Skill Check",`:</span> <span class="check">Check</span>`);
  //   }else if(flavorText.includes("Ability Check")){
  //     newFlavor = `<span class="item-name">` + flavorText;
  //     newFlavor = newFlavor.replace("Ability Check",`:</span> <span class="check">Check</span>`);
  //   }else if(flavorText.includes("Saving Throw")){
  //     newFlavor = `<span class="item-name">` + flavorText;
  //     newFlavor = newFlavor.replace("Saving Throw",`:</span> <span class="save">Save</span>`);
  //   }else if((rollType==="tool" || rollType==="check") && flavorText.includes("Check")){
  //     newFlavor = `<span class="item-name">` + flavorText;
  //     newFlavor = newFlavor.replace("Check",`:</span> <span class="check">Check</span>`);
  //   }else if(item){
  //     newFlavor = `<span class="item-name">${item.type}</span>`;
  //   }else if(!newFlavor){
  //     newFlavor = `<span class="item-name">Info</span>`;
  //   }

  //   return newFlavor;
  // }
}