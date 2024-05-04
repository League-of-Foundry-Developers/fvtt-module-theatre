import API from "./API/api.js";
import CONSTANTS from "./constants/constants.js";
import Logger from "./lib/Logger.js";

export let theatreSocket;

export function registerSocket() {
  Logger.debug("Registered theatreSocket");
  if (theatreSocket) {
    return theatreSocket;
  }

  theatreSocket = socketlib.registerModule(CONSTANTS.MODULE_ID);

  // ON Theatre.js class
  // theatreSocket.register("processEvent", (...args) => API.processEventArr(...args));

  game.modules.get(CONSTANTS.MODULE_ID).socket = theatreSocket;
  return theatreSocket;
}
