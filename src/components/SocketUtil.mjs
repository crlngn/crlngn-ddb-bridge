import { MODULE_ID } from "../constants/General.mjs";
import { HOOKS_SOCKET } from "../constants/Hooks.mjs";
import { LogUtil } from "./LogUtil.mjs";

/**
 * Utility class for managing socket communication using socketlib.
 */
export class SocketUtil {
  static socket;

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
  static execAsGM = async (handler, ...parameters) => {
    if (!SocketUtil.socket) {
        LogUtil.log("SocketUtil - Socket not initialized. Cannot execute as GM.");
        return;
    }
    return await SocketUtil.socket.executeAsGM(handler, ...parameters);
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
  static execAsUser = async (handler, userId, ...parameters) => {
    if (!SocketUtil.socket) {
        LogUtil.log("SocketUtil - Socket not initialized. Cannot execute as user.");
        return;
    }
    
    // We need to use the original handler, but we'll handle deserialization on reception
    const resp = await SocketUtil.socket.executeAsUser(handler, userId, ...parameters);
    LogUtil.log("SocketUtil - Executed as user.", [resp]);
    return resp;
  }

  /**
   * Serializes an object for transport, handling Roll objects properly
   * @param {*} data - The data to serialize
   * @returns {*} - Serialized data
   */
  static serializeForTransport(data) {
    // Handle null or undefined
    if (data == null) return data;
    
    if (data.rolls && Array.isArray(data.rolls)) {
      // data.rolls = data.rolls.map(r => SocketUtil.serializeForTransport(r));
      
      data.rolls = data.rolls.map(r => {
        if(r instanceof Roll){
          let test = r.toJSON();
          return test;
        }else{
          return r;
        }
      });
    }
    LogUtil.log("ROLL?? A", [data]);
    
    return data;
  }

  /**
   * Deserializes data received from transport, reconstructing Roll objects
   * @param {*} data - The serialized data
   * @returns {*} - Deserialized data with reconstructed objects
   */
  static deserializeFromTransport(data) {
    let result = {};
    // Handle null or undefined
    if (data == null) return data;

    if(data.rolls && data.rolls.length > 0){
      // rolls = data.rolls.map(r => Roll.fromJSON(JSON.stringify(r)));
      
      result = {
        ...data,
        rolls: data.rolls.map(r => {
          if(typeof r === 'string'){
            return Roll.fromJSON(r);
          }else{
            return Roll.fromJSON(JSON.stringify(r));
          }
        })
      }
    }
    LogUtil.log("ROLL! A ", [result]);
    
    
    return result;
  }

}
