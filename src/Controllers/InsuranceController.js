const insurance = require('../classes/insurance');
const { AccountController } = require('./AccountController');
const { TradingController } = require('./TradingController');

class InsuranceController {

    /**
     * Currently runs on every call to the server. 
     * DO a check whether to expire or return insurance items.
     */
     static checkExpiredInsurance() {
        // logger.logInfo("checkExpiredInsurance");
        for(const p in AccountController.profiles) {
            const prof = AccountController.getPmcProfile(p);
            // console.log(prof);
            if(prof !== undefined && prof.InsuredItems !== undefined) {
                for (const insurance of prof.InsuredItems) {
                    // console.log("insuredItem");
                    // console.log(insurance);
                    if(insurance.lostTime !== undefined 
                        && insurance.lostTime <= Date.now()) { 
                    console.log(insurance);

                            console.log("doing insurance calc");
                    }
                }
            }
        }
        // let scheduledEvents = events.scheduledEventHandler.scheduledEvents;
        // let now = Date.now();

        // for (let count = scheduledEvents.length - 1; count >= 0; count--) {
        //     let event = scheduledEvents[count];

        //     if (event.type === "insuranceReturn" && event.scheduledTime <= now) {
        //         events.scheduledEventHandler.processEvent(event);
        //         events.scheduledEventHandler.removeFromSchedule(event);
        //     }
        // }
    }
    /**
     * Adds the items to the InsuredItems list on the Profile
     * @param {*} pmcData 
     * @param {*} body 
     * @param {*} sessionID 
     * @returns {object} output
     */
    static insure(pmcData, body, sessionID) {
        let itemsToPay = [];
    
        let inventoryItemsHash = {};
        pmcData.Inventory.items.forEach(i => inventoryItemsHash[i._id] = i);
    
        // get the price of all items
        for (let key of body.items) {
            itemsToPay.push({
                "id": inventoryItemsHash[key]._id,
                "count": ~~(InsuranceController.getPremium(pmcData, inventoryItemsHash[key], body.tid))
            });
        }
    
    
        // pay the item	to profile
        if (!helper_f.payMoney(pmcData, { "scheme_items": itemsToPay, "tid": body.tid }, sessionID)) {
            logger.logError("no money found");
            return "";
        }
    
        // add items to InsuredItems list once money has been paid
        for (let key of body.items) {
            pmcData.InsuredItems.push({
                "tid": body.tid,
                "itemId": inventoryItemsHash[key]._id
            });
        }
    
        AccountController.saveToDisk(sessionID);
        return item_f.handler.getOutput(sessionID);
    }

    /**
     * Calculates the cost of the Item to Insure
     * @param {*} pmcData 
     * @param {*} inventoryItem 
     * @param {*} traderId 
     * @returns {Number} cost
     */
    static getPremium(pmcData, inventoryItem, traderId) {    
        let loyaltyLevelIndex = TradingController.getLoyalty(pmcData, traderId) - 1;
        let trader = TradingController.getTrader(traderId, pmcData.aid);
        let insuranceMultiplier;
        insuranceMultiplier = trader.loyaltyLevels[loyaltyLevelIndex].insurance_price_coef / 100
    
        if (!insuranceMultiplier) {
            insuranceMultiplier = 0.3;
            Logger.warning(`No multiplier found for trader ${traderId}, check it exists in InsuranceConfig.js, falling back to a default value of 0.3`);
        }
    
        let premium = helper_f.getTemplatePrice(inventoryItem._tpl) * insuranceMultiplier;
        const coef = trader.loyaltyLevels[loyaltyLevelIndex].insurance_price_coef;
    
        if (coef > 0) {
            premium *= (1 - trader.loyaltyLevels[loyaltyLevelIndex].insurance_price_coef / 100);
        }
    
        return ~~(premium);
    }

    static storeLostGear(pmcData, offraidData, preRaidGear, sessionID) {
        console.log("storeLostGear");
        // Build a hash table to reduce loops
        const preRaidGearHash = {};
        preRaidGear.forEach(i => preRaidGearHash[i._id] = i);

        // Build a hash of offRaidGear
        const offRaidGearHash = {};
        offraidData.profile.Inventory.items.forEach(i => offRaidGearHash[i._id] = i);
        
        for (const insuredItem of pmcData.InsuredItems) {
            if (preRaidGearHash[insuredItem.itemId]) {
                // This item exists in preRaidGear, meaning we brought it into the raid...
                // Check if we brought it out of the raid
                if (!offRaidGearHash[insuredItem.itemId]) {
                    insuredItem.lostTime = Date.now();
                    console.log("stored lost gear item");
                    console.log(insuredItem);
                }
            }
        }
    }

}

module.exports.InsuranceController = InsuranceController;