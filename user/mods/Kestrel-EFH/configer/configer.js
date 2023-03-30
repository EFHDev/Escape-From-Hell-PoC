const path = require('path');
const unlockTraders = require("./unlockTraders")
const config = require("../config.json");

const modulesToLoad = [//nah its not needed, it was going ot be the housing for the stuff that used configs, but i scrapped it, just forgot to delete, just normal mod.js, 
  "unlockTrader.js",
];

const traderscfg = { // okay so how are your modules loaded then
  traderscfg: unlockTraders.onLoadMod
  // Add any other paths you want to use here
};

module.exports = {
  modulesToLoad: modulesToLoad,
  traderscfg: traderscfg
};