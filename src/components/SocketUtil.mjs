import { MODULE_ID } from "../constants/General.mjs";
import { HOOKS_SOCKET } from "../constants/Hooks.mjs";
import { LogUtil } from "./LogUtil.mjs";

/**
 * Utility class for managing socket communication using socketlib.
 */
export class SocketUtil {
  static socket;
  static _activeExecutions = new Map();

  /**
   * Initializes the socket module and registers it with socketlib.
   * This should be called once during FoundryVTT initialization.
   * 
   * @param {Function} callbackFunc - Optional callback to execute after registration.
   */
  static initialize = (callbackFunc) => {
    Hooks.once(HOOKS_SOCKET.READY, () => { 
      LogUtil.log(`Attempting to register module...`);

      // Check if socketlib is available before registering the module
      if (typeof socketlib === "undefined") {
        LogUtil.error("SocketUtil Error: socketlib is not loaded. Ensure it is installed and enabled.");
        ui.notifications.error(game.i18n.localize("CRLNGN_ROLLS.notifications.socketlibMissing"), {permanent: true});
        return;
      }

      try { 
        // Register the module with socketlib
        SocketUtil.socket = socketlib.registerModule(MODULE_ID);

        // Execute callback function if provided
        if (callbackFunc) {
          callbackFunc();
        }

        LogUtil.log(`SocketUtil | Module registered`, [SocketUtil.socket]);
      } catch (e) {
          LogUtil.log(`Problem registering module`, [e]);
      }
    });
  }

  /**
   * Registers a callback function that can be called remotely via the socket.
   * 
   * @param {string} name - The name of the remote function.
   * @param {Function} func - The function to be executed remotely.
   */
  static registerCall = (name, func) => {
    if (SocketUtil.socket) {
      SocketUtil.socket.register(name, func);
      LogUtil.log(`SocketUtil - Registered callback`, [SocketUtil.socket, name]);
    } else {
      LogUtil.log(`SocketUtil - Failed to register callback (socket not initialized)`, [SocketUtil.socket, name]);
    }
  }

  /**
   * Sends a message via the socket (currently only logs it and calls a callback).
   * 
   * @param {*} value - The message or data to send.
   * @param {Function} callback - The callback function to execute after sending.
   */
  static sendMessage = (value, callback) => {
    LogUtil.log(`SocketUtil - sendMessage`, [value]);
    if (callback) {
        callback();
    }
  }

  /**
   * Executes a function as the GM.
   * 
   * @param {Function} handler - The function to execute.
   * @param {...*} parameters - The parameters to pass to the function.
   * @returns {Promise} A promise resolving when the function executes.
   */
  static execForGMs = async (handler, ...parameters) => {
    if (!SocketUtil.socket) {
      LogUtil.log("SocketUtil - Socket not initialized. Cannot execute as GM.");
      return;
    }
    return await SocketUtil.socket.executeForAllGMs(handler, ...parameters);
  }

  /**
   * Executes a function for all connected clients.
   * 
   * @param {Function} handler - The function to execute.
   * @param {...*} parameters - The parameters to pass to the function.
   * @returns {Promise} A promise resolving when the function executes for all clients.
   */
  static execForAll = async (handler, ...parameters) => {
    if (!SocketUtil.socket) {
      LogUtil.log("SocketUtil - Socket not initialized. Cannot execute for all clients.");
      return;
    }
    return await SocketUtil.socket.executeForEveryone(handler, ...parameters);
  }


  /**
   * Executes a function as the specified user.
   * @param {Function} handler - The function to execute.
   * @param {String} userId - the id of the user that should execute this function
   * @param {...*} parameters - The parameters to pass to the function.
   * @returns {Promise} A promise resolving when the function executes.
   */
  static execForUser = async (handler, userId, ...parameters) => {
    if (!SocketUtil.socket) {
        LogUtil.log("SocketUtil - Socket not initialized. Cannot execute as user.");
        return;
    }

    if(userId === game.user.id){
      LogUtil.log("SocketUtil - Preventing recursive call", [userId]);
      return null; // Break the recursion
    }
    const executionKey = `${handler}-${userId}`;
    
    // Check if this exact execution is already in progress
    if (SocketUtil._activeExecutions.has(executionKey)) {
        LogUtil.log("SocketUtil - Preventing recursive call", [executionKey]);
        return null; // Break the recursion
    }
    // Mark this execution as active
    SocketUtil._activeExecutions.set(executionKey, true);
    
    try {
        const resp = await SocketUtil.socket.executeAsUser(handler, userId, ...parameters);
        LogUtil.log("SocketUtil - Executed as user.", [resp]);
        return resp;
    } catch (error) {
        LogUtil.log("SocketUtil - Error executing as user", [error]);
        return null;
    } finally {
        // Always clean up, even if there was an error
        SocketUtil._activeExecutions.delete(executionKey);
    }
  }

  /**
   * Serializes an object for transport, handling Roll objects properly
   * @param {*} data - The data to serialize
   * @returns {*} - Serialized data
   */
  static serializeForTransport(data) { 
    // Handle null or undefined
    if (data == null) return data;
    
    // Log the original data structure
    LogUtil.log("Serializing data - Original structure", [
      "Keys:", Object.keys(data || {}),
      "Has rolls:", Boolean(data.rolls),
      "Rolls length:", data.rolls?.length
    ]);
    
    // Create a safe copy to avoid modifying the original
    let safeData = { ...data };
    
    // Handle Roll objects in the rolls array
    if (safeData.rolls && Array.isArray(safeData.rolls)) {
      // Log roll information before serialization
      LogUtil.log("Roll objects before serialization", [
        "Roll count:", safeData.rolls.length,
        "Roll types:", safeData.rolls.map(r => r?.constructor?.name || typeof r)
      ]);
      
      safeData.rolls = safeData.rolls.map(r => {
        if(r instanceof Roll){
          let serialized = r.toJSON();
          // Log individual roll serialization
          LogUtil.log("Serialized roll", [
            "Original:", r.formula,
            "Serialized keys:", Object.keys(serialized)
          ]);
          return serialized;
        } else {
          return r;
        }
      });
    }
    
    // Try to detect potential circular references
    try {
      JSON.stringify(safeData);
      LogUtil.log("Data serialized successfully without circular references");
    } catch (error) {
      LogUtil.error("Circular reference detected in data", [
        "Error:", error.message,
        "Keys with potential circular refs:", Object.keys(safeData || {})
      ]);
      
      // Log specific properties that might contain circular references
      if (safeData.actor) LogUtil.log("Actor property exists", [typeof safeData.actor]);
      if (safeData.item) LogUtil.log("Item property exists", [typeof safeData.item]);
      if (safeData.workflow) LogUtil.log("Workflow property exists", [typeof safeData.workflow]);
      if (safeData.message) LogUtil.log("Message property exists", [typeof safeData.message]);
      if (safeData.flags) LogUtil.log("Flags property exists", [typeof safeData.flags, Object.keys(safeData.flags || {})]);
      if (safeData.speaker) LogUtil.log("Speaker property exists", [typeof safeData.speaker, Object.keys(safeData.speaker || {})]);
    }
    
    return safeData;
  }

  /**
   * Deserializes data received from transport, reconstructing Roll objects
   * @param {*} data - The serialized data
   * @returns {*} - Deserialized data with reconstructed objects
   */
  static deserializeFromTransport(data) {
    // Log the received data structure
    LogUtil.log("Deserializing data - Received structure", [
      "Data type:", typeof data,
      "Is null/undefined:", data == null,
      "Keys:", Object.keys(data || {}),
      "Has rolls:", Boolean(data?.rolls),
      "Rolls length:", data?.rolls?.length
    ]);
    
    let result = { ...data };
    if (!data) return result;

    if(data.rolls && data.rolls.length > 0){
      // Log roll information before deserialization
      LogUtil.log("Roll data before deserialization", [
        "Roll count:", data.rolls.length,
        "Roll types:", data.rolls.map(r => typeof r)
      ]);
      
      try {
        const rolls = result.rolls.map(r => {
          let roll = r;
          if(typeof r === 'string'){
            roll = Roll.fromJSON(r);
          } else {
            roll = Roll.fromJSON(JSON.stringify(r));
          }
          // Log individual roll deserialization
          LogUtil.log("Deserialized roll", [
            "Result formula:", roll.formula,
            "Result total:", roll.total
          ]);
          return roll;
        });
        result.rolls = [...rolls];
      } catch (error) {
        LogUtil.error("Error deserializing rolls", [
          "Error:", error.message,
          "Roll data:", data.rolls
        ]);
      }
    }
    
    return result;
  }

}
