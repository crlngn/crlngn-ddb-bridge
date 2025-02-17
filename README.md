**Latest Version:** 2.0.0

**Requirements:** 
- Foundry VTT version 12.328 to 12.331
- DnD5e version 4.0.3 to 4.3.1
- DDB Gamelog module by Warhead, version 2.2.0 to 2.3.2-beta
- Socketlib 1.x

**🛠 Important: Restart Required!**
This update adds socket support. Reload your world after updating the module from 1.x to 2.x to ensure everything works correctly. Simply reloading your browser won't do it.

[auto-template-target-saves-b.webm](https://github.com/user-attachments/assets/6e7a39eb-ef04-46e7-9c94-e22365e546b2)

## Carolingian DDB Bridge
This module adds features and compatibility to [DDB Gamelog](https://github.com/IamWarHead/ddb-game-log/) by **Warhead**. It allows users to use core Foundry/DnD5e features, like application of effects and quick chat buttons, while using Warhead's DDB Gamelog module to roll from D&D Beyond, making life a bit easier for the DM. 
DDB Gamelog currently offers limited support for DnD5e 4.x and does not offer native activity capabilities, so I am bridging this gap. 

From version 2.x, DDB Bridge requires socketlib, so rolls can be made on each user's client if the roll came from their D&D Beyond character. This allows the owner user to place templates when a spell requires it, and fetches the targets from specified user.

Some features like the chat message styling and template auto-target do not depend on Gamelog Pro tier to work. If you are only interested in dark style for chat messages, try my module Carolingian UI.

While **Carolingian DDB Bridge module** is free to use and distribute, **DDB Gamelog** is a different module which has a Free tier and a Pro tier with different features. Many features of my module will only work for Pro tier users of DDB Gamelog. **Warhead** is not responsible for maintaining the module in this repo, please don't bother him with requests. 


### IMPORTANT:
- The module is currently **NOT** compatible with Midi-QOL. It might also not be compatible with other modules which modify rolls or chat messages - please check before using;
- The module is currently compatible with Ready Set Roll 5e v3.4.2~ (which will only work for rolls made from within Foundry)
- This module is not compatible with versions of Foundry before v12 and DnD5e v4.0.x;

### FEATURES:
- Support for activities in DnD 4.0.3 - 4.3.1 when rolling with DDB Gamelog module (from D&D Beyond website or app);
- Support for JB2A / Automated Animations for spells and attacks;
- Spells rolled from DDB which have templates will auto-trigger its template placement in Foundry;
- The template auto-targets tokens in the area of placement;
- The template is auto-removed after damage is rolled (configurable via settings);
- You can choose if GM or player places templates;
- After rolling leveled spells you will get a button on chat card to consume or refund a spell slot for that spell on the player's sheet (**Note:** the button currently consumes the regular level of the spell, not an upcast slot);
- If the spell has a saving throw, you'll also get a button to quickly roll the saving throw for selected tokens
- If you select "Dark" style mode on DDB Gamelog configurations, all chat cards will follow that style, including those rolled on Foundry;
- Skips Foundry configuration window for quick rolls

### BUGS AND FEATURE REQUESTS:
- Please use the issue tracker to report any bugs and enhancements using the appropriate labels.
- If you would like to disable a specific feature, please request this as an enhancement on the issue tracker

### PLANNED FEATURES:
I am currently evaluating the following features:
- Automatically rolling saves for NPCs / enemies
- Adding custom rolls as bonuses to a previous roll from D&D Beyond (for example, for Bardic inspiration or Bless)
- Retroactively changing a regular roll from D&D Beyond to advantage/disadvantage by clicking a button and waiting for the new roll
