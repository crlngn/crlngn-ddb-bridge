import "./styles/main.css";
import "./styles/chat.css";
import { Main } from "./components/Main.mjs";

Main.registerHooks();
/*
const token = canvas.tokens.controlled[0];
const weapon = token.actor.items.find((it,i)=>it.name=="Warhammer");
const activity = weapon?.system.activities.getByType("attack")[0];

console.log('canvas.tokens', canvas.tokens);
const rollConfig = {
   flags: {
     dnd5e: {
       messageType: "roll",
       roll: { type: "attack" }
     }
   },
   user: game.user,
   flavor: `<span>${weapon.name}</span>`,
   user: game.user.id,
   speaker: {
     actor: "mnmr5ubAypEwlg1K",
     alias: "Guntred",
     scene: "sLKv97LIez7YMBVO",
     token: "lGRRRhBJ85Bw1dXy"
   }
}
const actRolls = await activity.rollAttack(rollConfig, { configure:false }, { create: false });

const rollData = {
   ...rollConfig,
   rolls: actRolls,
   flags: {
    dnd5e: {
      roll: { type: "attack" },
      targets: [
         {
            name: "Ghost",
            img: "https://www.dndbeyond.com/avatars/30783/918/638062023594890763.png?1733989892125",
            uuid: "Scene.sLKv97LIez7YMBVO.Token.Fx3Ty8JYST9m9nxD.Actor.MXrFGTfENV49a166",
            ac: 11
         }
      ]
    }
   }
}
await ChatMessage.create(rollData);

const visibility = game.settings.get("dnd5e", "attackRollVisibility");
const isVisible = game.user.isGM || (visibility !== "none");
console.log('Attack results visible', isVisible, visibility);
*/