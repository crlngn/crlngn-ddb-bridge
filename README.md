**Latest Version:** v1.0.1 / 
**Compatibility:** Foundry v12.331 & DnD5e 4.1.2

## Carolingian DDB Bridge
This module is a bridge to add features and compatibility to [DDB Gamelog](https://github.com/IamWarHead/ddb-game-log/) by **Warhead**. 
While **Carolingian DDB Bridge module** is free to use and distribute, DDB Gamelog has a Free tier and a Pro tier with different features - the DDB feature of my module will only work for Pro tier users of DDB Gamelog. **Warhead** is not responsible for maintaining this module, please don't bother him with requests.
Some features like the dark mode and template auto-target do not depend on Gamelog Pro tier.

### IMPORTANT:
- The module is currently **NOT** compatible with Midi-QOL. It might also not be compatible with other modules which modify rolls or chat messages - please check before using;
- The module is currently compatible with Ready Set Roll 5e v3.4.2 (which will only work for rolls made from within Foundry)
- This module is not compatible with versions of Foundry before v12 and DnD5e v4.0.x;

### FEATURES:
- Support for activities in DnD 4.0.3 - 4.1.2 when rolling with DDB Gamelog module (from D&D Beyond website or app);
- Support for JB2A / Automated Animations for spells and attacks;
- Spells rolled from DDB which have templates will auto-trigger its template placement in Foundry;
- The template auto-targets tokens in the area of placement;
- The template is auto-removed after damage is rolled;
- After rolling leveled spells you will get a button on chat card to consume or refund a spell slot for that spell on the player's sheet;
- If the spell has a saving throw, you'll also get a button to quickly roll the saving throw for selected tokens
- If you select "Dark" style mode on DDB Gamelog configurations, all chat cards will follow that style, including those rolled on Foundry;
- Skips Foundry configuration window for quick rolls

### BUGS AND FEATURE REQUESTS:
- Please use the issue tracker to report any bugs and enhancements using the appropriate labels.
- As of this version only debug configuration is available. If you would like to disable a specific feature, please request this as an enhancement on the issue tracker

### PLANNED FEATURES
I am currently evaluating the following features:
- Settings to toggle template auto-targetting on/off
- Settings for unskipping the roll configuration window by pressing a key
- Automatically rolling saves for NPCs / enemies
- Adding custom rolls as bonuses to a previous roll from D&D Beyond (for example, for Bardic inspiration or Bless)
- Retroactively changing a regular roll from D&D Beyond to advantage/disadvantage by clicking a button and waiting for the new roll
