// This is designed to load the custom logger from the sit server, among other things probally lol, 
// If your porting your mod to AKI, JET, MTGA, you need to remove this file, and change your logger.Log statements to
// whatever that version of EmuTarkov uses. 
//This file isnt detramental for the running of mods, but it makes it use the native logging in the server 
// Which allows you to use the logSuccess and logError which can help you signify what is and isnt a error, and allows you
// To say what is a debug log, that should only be shown when "ShowDebugLogs" is enabled. You can also add anything else here
// LIke keys or smth idk man.
const EFHPath = require('path');

const EFHMOD = {
  logger: EFHPath.resolve(__dirname, '../../../core/util/logger'),
  // Add any other paths you want to use here
};

module.exports = EFHMOD;