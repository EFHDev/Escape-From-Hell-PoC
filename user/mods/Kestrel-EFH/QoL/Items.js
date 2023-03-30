const items = DatabaseServer.tables.templates.items;
const config = require("../config.json")
const chalk = require('chalk');
const EFHMOD = require('../efh-mod');
const logger = require(EFHMOD.logger).logger;
const {HideoutProduction} = require("../content/Keycards/KeycardSystem");
const { databases } = require("../../../../core/efh/modding-keys");
const{ minusPercent } = require( "../../../../core/util/utility");
const hideout3 = _database.hideout.production


class Items {
    /**
     * Iterate through and adjust items based on _type property and configurations set
     */
    static adjustItems() {
        this.ExaminedItems = 0;
        this.DiscardLimitChange = 0;
        this.StackAdjustedItems = 0;
        this.KeyCardAdjusted = 0;
        this.ProductionChange = 0;


        for (const id in items) {
            const item = items[id];

            if (!item._props) {
                logger.logDebug(`Item ${id} does not have _props property`);
                continue;
            }

            switch (item._type) {
                case "Node":
                    this.itemIsNode(item);
                    break;

                case "Item":
                    this.itemIsItem(item);
                    break;

                default:
                    logger.logDebug(`Item ${id} _type ${item._type} isn't handled`);
            }
        }
        if (this.ExaminedItems === 0) {
            this.ExaminedItems = chalk.redBright("Disabled");
          }
          if (this.DiscardLimitChange === 0) {
            this.DiscardLimitChange = chalk.redBright("Disabled");
          }
          if (this.StackAdjustedItems === 0) {
            this.StackAdjustedItems = chalk.redBright("Disabled");
          }
          if (this.KeyCardAdjusted === 0) {
            this.KeyCardAdjusted = chalk.redBright("Disabled");
          }
          if (this.ProductionChange === 0) {
            this.ProductionChange = chalk.redBright("Disabled");
          }
        logger.logSuccess(chalk.blueBright(chalk.underline("|                                                                Configurable Changes" + "                                                     |")))
        logger.logSuccess(chalk.blue(` Discard Limit Change: ${this.DiscardLimitChange} || Examined Items: ${this.ExaminedItems} || Stacks Adjusted: ${this.StackAdjustedItems} || Keycards Uses Adjusted: ${this.KeyCardAdjusted} || Faster Production: ${this.ProductionChange}`));
        logger.logSuccess(chalk.blueBright(chalk.underline("|                                                                                                                                         |")))
    } 

    /**
     * Item type is "Node" and is adjusted here based on configurations set
     */
    static itemIsNode(item) {
        if (config.qol.unlimitedDiscard)
            this.RemoveDiscardLimit(item);

        if (config.qol.examineAll)
            this.ExamineItem(item);
    }


    /**
    * Item type is "Item" and is adjusted here based on configurations set
    */
    static itemIsItem(item) {
        if (config.qol.adjustAmmoStacks && item._parent === '5485a8684bdc2da71d8b4567')
            this.StackSizes(item);
        this.ExamineItem(item);
        this.RemoveDiscardLimit(item);
        if (config.efhcore.UseKeycardChanges = true) {
            this.IsItemKeycard(item);
        }
    }

    /**
     * Remove item discard limit by setting to -1 (unlimited)
     */
    static RemoveDiscardLimit(item) {
        if (!item._props?.DiscardLimit)
            return;

        item._props.DiscardLimit = -1;

        if (config.debug.deepdebug)
            logger.logDebug(`Item ${item._name} can be discarded unlimitedly`);

        this.DiscardLimitChange++
    }
    static IsItemKeycard(item) {
        if (item._parent === "5c164d2286f774194c5e69fa") {
            if (!config.efhcore.KeycardMaxUse < 0  ) {
                item._props.MaximumNumberOfUsage = 0;
                logger.logError("Keycard Max Use set to 0 or lower. This is unlimited you pussy!!!!!!!")
                this.KeyCardAdjusted += 1;
            }   
            else if (config.efhcore.KeycardMaxUse === null || config.efhcore.KeycardMaxUse === undefined) {
                logger.logError("MaxKeycardUse is null or undefined! Defaulting to 1.")
                item._props.MaximumNumberOfUsage = 1;
                this.KeyCardAdjusted += 1;
            }
            else {
                item._props.MaximumNumberOfUsage = config.efhcore.KeycardMaxUse;
                if (config.debug.deepdebug = true) {
                logger.logDebug(`Set ${item._name} had its max uses set to ${config.efhcore.KeycardMaxUse}`)
                logger.logDebug(`sex ${item._id}`)
                }
                this.KeyCardAdjusted += 1;
            }
            const PrdItmID = item._id
            HideoutProduction(PrdItmID);
        }
    }


    /**
     * Examine item by default
     */
    static ExamineItem(item) {
        if (item._props?.ExaminedByDefault)
            return;

        item._props.ExaminedByDefault = true;

        if (config.debug.deepdebug)
            logger.logDebug(`Examined Item ${item._name}`);

        this.ExaminedItems++
    }

    static StackSizes(item) {
        if (["Caliber26x75",
            "Caliber40x46",
            "Caliber127x108",
            "Caliber40mmRU",
            "Caliber30x29"].includes(item._props.Caliber)) //mounted gun ammo or flares
            return;

        switch (item._props.Caliber) {
            case "Caliber9x19PARA":
            case "Caliber1143x23ACP":
            case "Caliber762x25TT":
            case "Caliber9x18PM":
            case "Caliber9x18PMM":
            case "Caliber9x33R":
            case "Caliber57x28":
            case "Caliber46x30":
            case "Caliber9x21":
                item._props.StackMaxSize = "160"
                if (config.debug.deepdebug)
                    logger.logDebug(`Changed Stacksize of ${item._name} to ${chalk.red(item._props.StackMaxSize)}`);
                this.StackAdjustedItems++
                break;

            case "Caliber762x39":
            case "Caliber9x39":
            case "Caliber366TKM":
            case "Caliber545x39":
            case "Caliber556x45NATO":
            case "Caliber762x35":
            case "Caliber762x51":
            case "Caliber762x54R":
                item._props.StackMaxSize = "120"
                if (config.debug.deepdebug)
                    logger.logDebug(`Changed Stacksize of ${item._name} to ${chalk.red(item._props.StackMaxSize)}`);
                this.StackAdjustedItems++
                break;

            case "Caliber12g":
            case "Caliber20g":
            case "Caliber23x75":
            case "Caliber127x55":
            case "Caliber86x70":
                item._props.StackMaxSize = "40"
                if (config.debug.deepdebug)
                    logger.logDebug(`Changed Stacksize of ${item._name} to ${chalk.red(item._props.StackMaxSize)}`);
                this.StackAdjustedItems++
                break;

            default:
                logger.logDebug(`Item ${item._id} with caliber of ${item._props.Caliber} named  ${item._name} is invalid! Nothing happened to it!`);
                break;
        }
    }
    static FasterHideoutProduction() {
        for (const id in hideout3 ) {
            const productionedit = hideout3[id];
            let productioneditoringaltime = productionedit.productionTime
            productionedit.productionTime = minusPercent(productionedit.productionTime, 50)//Removes 50% of production time probally lol
            console.logDebug(`[EFH]Changed production with the id of ${productionedit._id} production time from ${productioneditoringaltime} to ${productionedit.productionTime}`)
            this.ProductionChange++
    }
}
}
module.exports = Items;