"use strict";
const chalk = require('chalk');
const efhlogo = ((chalk.white.bold('[EF') + chalk.red.bold('H') + chalk.white(']')));
const traders = DatabaseServer.tables.traders
const EFHMOD = require('../efh-mod');
const logger = require(EFHMOD.logger).logger;
const { colors } = require('../../../../core/efh/accessibility'); 

class UnlockTradersClass {
    static UnlockTradersByDefault() { 
        for (const id in traders) {
            if (traders[id].base.nickname == "")
                continue;

            traders[id].base.unlockedByDefault = true
            logger.logSuccess(efhlogo + " Unlocked Trader " + chalk.hex(colors.blue)(traders[id].base.nickname) + "...")
        }
    }
}

module.exports = UnlockTradersClass
