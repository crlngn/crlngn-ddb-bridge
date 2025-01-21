import { ROLL_TYPES } from "../constants/General.mjs";
import "../styles/chat.css"
import { LogUtil } from "./LogUtil.mjs";

export class ChatUtil {

  static enrichCard(chatMessage, html){
    const rollType = chatMessage.flags?.dnd5e?.activity?.type || chatMessage.flags?.dnd5e?.roll?.type || "custom";
  
    html.classList.remove('ddb-game-log-open-card');
    html.classList.add('crlngn');
    html.classList.add(rollType);
    

    let senderSubtitle = html.querySelector(".message-sender .subtitle");
    let senderFlavor = html.querySelector(".message-sender .flavor-text");
    let headerFlavor = html.querySelector(".message-header .flavor-text");
    if(!chatMessage.flags?.["ddb-game-log"]){
      /** replace author subtitle with flavor text, for space optimization */
      const flavorText = headerFlavor?.innerHTML;
      if(flavorText){
        if(senderSubtitle) senderSubtitle.innerHTML = flavorText;
        if(senderFlavor) senderFlavor.innerHTML = flavorText;
      }else{
        if(senderSubtitle) senderSubtitle.innerHTML = "Message";
      }
      
      senderSubtitle.innerHTML = ChatUtil.formatFlavorText(senderSubtitle.innerHTML, chatMessage, rollType);
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