
export class GeneralUtil {
  /**
   * Identifies the current selected or targeted tokens
   * @returns {Set} A set of targeted tokens
   */
  static getTargets(user) {
    let targetTokens = game.user.targets || user.targets || game.user.selected || user.selected || [];

    return new Set([...targetTokens]);
  }


  /**
  * Grab the targeted tokens and return relevant information on them.
  * @returns {TargetDescriptor[]}
  */
  static getTargetDescriptors() {
   const targets = new Map();
   for ( const token of game.user.targets ) {
     const { name } = token;
     const { img, system, uuid, statuses } = token.actor ?? {};
     if ( uuid ) {
       const ac = statuses.has("coverTotal") ? null : system.attributes?.ac?.value;
       targets.set(uuid, { name, img, uuid, ac: ac ?? null });
     }
   }
   return Array.from(targets.values());
 }

/**
 * Checks if module is currently installed and active
 * @param {string} moduleName 
 * @returns 
 */
  static isModuleOn(moduleName){
    const module = game.modules?.get(moduleName);
    return module ? true : false;
  }
}

