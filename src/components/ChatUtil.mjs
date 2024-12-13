import { CLASS_PREFIX } from "../constants/General.mjs";
import { LogUtil } from "./LogUtil.mjs";
import "../styles/chat.css"

export class ChatUtil {
  /**
   * Takes the message configuration object and adds necessary 
   * module classes and elements to the message content 
   * @param {ActivityMessageConfiguration} msg
   * @returns {ActivityMessageConfiguration}
   */
  static enrichUsageCard(msg){
    if(!msg.data?.content){ 
      LogUtil.warn("ChatUtil.enrichUsageCard", ["No message content"]); 
      return msg; 
    } 

    const tempCardContainer = document.createElement('div');
    tempCardContainer.innerHTML = msg.data.content.toString();

    const card = tempCardContainer.querySelector('.activation-card');
    card?.classList.add(`${CLASS_PREFIX}-card`); 
    card?.classList.add(`${CLASS_PREFIX}-usage`); 

    msg.data.content = tempCardContainer.innerHTML.toString();
    LogUtil.log("ChatUtil.enrichUsageCard", [tempCardContainer]); 

    return msg;
  }

  static processChatCard(chatMessage, msgConfig, renderInfo, id){ 
    LogUtil.log("ChatUtil.processChatCard", [chatMessage, msgConfig]); 
    // const tempCardContainer = document.createElement('div');
    // tempCardContainer.innerHTML = chatMessage.
  }
}