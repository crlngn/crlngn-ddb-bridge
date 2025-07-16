**Latest Version:** 3.0.2

**Requirements:** 
- v2.x: Foundry VTT version 12.328+ / DnD5e version 4.x
- v3.x: Foundry VTT version 13.341+ / DnD5e version 5.x
- DDB Gamelog module by Warhead, version 2.2.0 to 2.4.0
- Socketlib 1.x

[auto-template-target-saves-b.webm](https://github.com/user-attachments/assets/6e7a39eb-ef04-46e7-9c94-e22365e546b2)

## DDB Gamelog Tweaks
This module adds features and compatibility to [DDB Gamelog](https://github.com/IamWarHead/ddb-game-log/) by **Warhead**. It allows users to use core Foundry/DnD5e features, like template triggering, application of effects, application of bonuses and quick chat buttons, while using Warhead's DDB Gamelog module to roll from D&D Beyond. 

DDB Bridge requires socketlib, so rolls can be made on each user's client if the roll came from their D&D Beyond character. This allows the owner user to place templates when a spell requires it, and fetches the targets from specified user.

Some features like the chat message styling and template auto-target do not depend on Gamelog Pro tier to work. If you are only interested in dark style for chat messages, try my module Carolingian UI.

While **DDB Gamelog Tweaks module** is free to use and distribute, **DDB Gamelog** is a different module which has a Free tier and a Pro tier with different features. Many features of my module will only work for Pro tier users of DDB Gamelog. **Warhead** is not responsible for maintaining the module in this repo, please don't bother him with requests. 


### IMPORTANT:
- The module is currently **NOT** compatible with Midi-QOL. It might also not be compatible with other modules which modify rolls or chat messages - please check before using;
- This module is not compatible with versions of Foundry before v12 and DnD5e v4.0.x;

### FEATURES:
- Support for activities in DnD 4.0.3 - 5.x when rolling with DDB Gamelog module (from D&D Beyond website or app);
- Application of targets and effects (choose player or GM as owner of the roll);
- Support for JB2A / Automated Animations for spells and attacks;
- Spells rolled from DDB which have templates will auto-trigger its template placement in Foundry;
- The template auto-targets tokens in the area of placement;
- The template is auto-removed after damage is rolled (configurable via settings);
- You can choose if GM or player should place templates;
- After rolling activities with consumption and save buttons, rolling from DnD Beyond posts these buttons to chat;
- If you select "Dark" style mode on Foundry or DDB Gamelog configurations, all chat cards will follow that style, including those rolled on Foundry;
- Skips Foundry configuration window for quick rolls

### BUGS AND FEATURE REQUESTS:
- Please use the issue tracker to report any bugs and enhancements using the appropriate labels.
- If you would like to disable a specific feature, please request this as an enhancement on the issue tracker
