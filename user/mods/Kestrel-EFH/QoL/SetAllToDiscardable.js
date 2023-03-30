"use strict";
const chalk = require('chalk');
const items = DatabaseServer.tables.templates.items;
const config = require("../config.json");
const EFHMOD = require('../efh-mod');
const logger = require(EFHMOD.logger).logger;

//Ight, think we good? oh, run it
class SetAllToDiscardableExamineAll {
    /**
     * Iterate through item database to remove Discard limits
     */
    static RemoveDiscardLock() {
        let EditedItems = 0;
        for (const id in items) {
            const item = items[id];
            if (item._type !== "Node" || item?._props)
                continue;

            if (item._props?.DiscardLimit)
                item._props.DiscardLimit = -1;

            if (config.examineAll)
                this.ExamineItem(item);

            EditedItems++
            if (config.deepdebug)
                logger.logSuccess(`Item ${item._name} can be discarded unlimitedly`);
        }

        logger.logSuccess(chalk.hex(colors.red)`Total items updated for DiscardLimit/Examine All: ${EditedItems}`);
    }

    static ExamineItem(item) {
        if (item._props?.ExaminedByDefault) {
            item._props.ExaminedByDefault = true;

            if (config.deepdebug)
                logger.logDebug(`Examined Item ${item._name}`);
        }
    }
}

module.exports = SetAllToDiscardableExamineAll;