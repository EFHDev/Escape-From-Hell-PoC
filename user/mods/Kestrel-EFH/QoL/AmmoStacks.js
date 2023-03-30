"use strict";
const items = DatabaseServer.tables.templates.items;
const config = require("../config.json")
const chalk = require('chalk');
const EFHMOD = require('../efh-mod');
const logger = require(EFHMOD.logger).logger;
//const parent = require("../../../../core/efh/modding-keys")
//const pid = parent.parent;

class AmmoStacksSize {
    static onLoadMod() {
        ModLoader.onLoad = this.StackSizes;
    }

    static StackSizes() {
        let EditedItems = 0;
        for (const id in items) {
            if (items[id]._parent !== '5485a8684bdc2da71d8b4567' || items[id]?._props?.Caliber === "Caliber40x46")
                continue;

            if (!items[id]._props)
                logger.logError(`[AmmoStacks.StackSizes] Item ${id} _props property does not exist, wtf mane!!!!!!!!!!!`);

            switch (items[id]._props.Caliber) {
                case "Caliber9x19PARA":
                case "Caliber1143x23ACP":
                case "Caliber762x25TT":
                case "Caliber9x18PM":
                case "Caliber9x18PMM":
                case "Caliber9x33R":
                case "Caliber57x28":
                case "Caliber46x30":
                case "Caliber9x21":
                    items[id]._props.StackMaxSize = "160"
                    if (config.deepdebug)
                        logger.logDebug(`Changed Stacksize of ${items[id]._name} to ${chalk.red(items[id]._props.StackMaxSize)}`);
                    EditedItems++
                    break;

                case "Caliber762x39":
                case "Caliber9x39":
                case "Caliber366TKM":
                case "Caliber545x39":
                case "Caliber556x45NATO":
                case "Caliber762x35":
                case "Caliber762x51":
                case "Caliber762x54R":
                    items[id]._props.StackMaxSize = "120"
                    if (config.deepdebug)
                        logger.logDebug(`Changed Stacksize of ${items[id]._name} to ${chalk.red(items[id]._props.StackMaxSize)}`);
                    EditedItems++
                    break;

                case "Caliber12g":
                case "Caliber20g":
                case "Caliber23x75":
                case "Caliber127x55":
                case "Caliber86x70":
                    items[id]._props.StackMaxSize = "40"
                    if (config.deepdebug)
                        logger.logDebug(`Changed Stacksize of ${items[id]._name} to ${chalk.red(items[id]._props.StackMaxSize)}`);
                    EditedItems++
                    break;

                default:
                    logger.logDebug(`AYYYYYY THIS CALIBER ${items[id]._props.Caliber} IS SUMMM BOOLSHIITTTEEEET ${items[id]._name}`);
                    break;
            }
        }

        logger.logSuccess(`Total items updated Stack Max Size = ${EditedItems}`);
    }
}
module.exports = AmmoStacksSize;