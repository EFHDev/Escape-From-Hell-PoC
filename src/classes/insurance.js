"use strict";

const { logger } = require("../../core/util/logger");
const { AccountController } = require("../Controllers/AccountController");
const { TradingController } = require("../Controllers/TradingController");

/**
 * 
 */
class InsuranceServer {
    constructor() {
        this.insured = {};
        // events.scheduledEventHandler.addEvent("insuranceReturn", this.processReturn.bind(this));
    }

    freeFromMemory(sessionID) {
        delete this.insured[sessionID];
    }

    /**
     * Currently runs on every call to the server. 
     * DO a check whether to expire or return insurance items.
     */
    checkExpiredInsurance() {
        // logger.logInfo("checkExpiredInsurance");
        for(const p in AccountController.profiles) {
            for (let insurance in p.InsuredItems) {
                console.log("insuredItem");
                console.log(insurance);
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

    /* remove insurance from an item */
    remove(pmcData, body) {
        let toDo = [body];

        //Find the item and all of it's relates
        if (toDo[0] === undefined || toDo[0] === null || toDo[0] === "undefined") {
            logger.logError("item id is not valid");
            return;
        }

        let ids_toremove = helper_f.findAndReturnChildren(pmcData, toDo[0]); // get all ids related to this item, +including this item itself

        for (let i in ids_toremove) { // remove one by one all related items and itself
            for (let a in pmcData.Inventory.items) {	// find correct item by id and delete it
                if (pmcData.Inventory.items[a]._id === ids_toremove[i]) {
                    for (let insurance in pmcData.InsuredItems) {
                        if (pmcData.InsuredItems[insurance].itemId == ids_toremove[i]) {
                            pmcData.InsuredItems.splice(insurance, 1);
                        }
                    }
                }
            }
        }
    }

    /* resets items to send on flush */
    resetSession(sessionID) {
        this.insured[sessionID] = {};
    }

    /* adds gear to store */
    addGearToSend(pmcData, insuredItem, actualItem, sessionID) {
        // Don't process insurance for melee weapon or secure container.
        if (actualItem.slotId === "Scabbard" || actualItem.slotId === "SecuredContainer") {
            return;
        }

        const pocketSlots = [
            'pocket1',
            'pocket2',
            'pocket3',
            'pocket4',
        ];

        // Check and correct the validity of the slotId.
        if (!("slotId" in actualItem) || pocketSlots.includes(actualItem.slotId) || !isNaN(actualItem.slotId)) {
            actualItem.slotId = "hideout";

        }

        // Clear the location attribute of the item in the container.
        if (actualItem.slotId === "hideout" && "location" in actualItem) {
            delete actualItem.location;
        }

        // Mark root-level items for later.
        if (actualItem.parentId === pmcData.Inventory.equipment) {
            actualItem.slotId = "hideout";
        }

        this.insured[sessionID][insuredItem.tid] = this.insured[sessionID][insuredItem.tid] || [];
        this.insured[sessionID][insuredItem.tid].push(actualItem);
        this.remove(pmcData, insuredItem.itemId);
    }

    /* store lost pmc gear */
    storeLostGear(pmcData, offraidData, preRaidGear, sessionID) {
        // Build a hash table to reduce loops
        const preRaidGearHash = {};
        preRaidGear.forEach(i => preRaidGearHash[i._id] = i);

        // Build a hash of offRaidGear
        const offRaidGearHash = {};
        offraidData.profile.Inventory.items.forEach(i => offRaidGearHash[i._id] = i);

        let gears = [];
        
        for (let insuredItem of pmcData.InsuredItems) {
            if (preRaidGearHash[insuredItem.itemId]) {
                // This item exists in preRaidGear, meaning we brought it into the raid...
                // Check if we brought it out of the raid
                if (!offRaidGearHash[insuredItem.itemId]) {
                    // We didn't bring this item out! We must've lost it.
                    gears.push({ "pmcData": pmcData, "insuredItem": insuredItem, "item": preRaidGearHash[insuredItem.itemId], "sessionID": sessionID });
                }
            }
        }

        for (let gear of gears) {
            this.addGearToSend(gear.pmcData, gear.insuredItem, gear.item, gear.sessionID);
        }
        //let fs = require('fs');
        //fs.writeFileSync("./LostGear.json", JSON.stringify(gears, null, 2));
    }

    /* store insured items on pmc death */
    storeDeadGear(pmcData, offraidData, preRaidGear, sessionID) {        
        let gears = [];

        let securedContainerItems = offraid_f.getSecuredContainer(offraidData.profile.Inventory.items);

        const preRaidGearHash = {};
        preRaidGear.forEach(i => preRaidGearHash[i._id] = i);

        const securedContainerItemHash = {};
        securedContainerItems.forEach(i => securedContainerItemHash[i._id] = i);

        const pmcItemsHash = {};
        pmcData.Inventory.items.forEach(i => pmcItemsHash[i._id] = i);

        for (let insuredItem of pmcData.InsuredItems) {
            if (preRaidGearHash[insuredItem.itemId] && !(securedContainerItemHash[insuredItem.itemId]) && !(typeof pmcItemsHash[insuredItem.itemId] === "undefined") && !(pmcItemsHash[insuredItem.itemId].slotId === "SecuredContainer")) {
                gears.push({ "pmcData": pmcData, "insuredItem": insuredItem, "item": pmcItemsHash[insuredItem.itemId], "sessionID": sessionID });
            }
        }

        for (let gear of gears) {
            this.addGearToSend(gear.pmcData, gear.insuredItem, gear.item, gear.sessionID);
        }
        //let fs = require('fs');
        //fs.writeFileSync("./DeadGear.json", JSON.stringify(gears, null, 2));
    }

    /* sends stored insured items as message */
    sendInsuredItems(pmcData, sessionID) {
        for (let traderId in this.insured[sessionID]) {
            let trader = trader_f.handler.getTrader(traderId, sessionID);
            let dialogueTemplates = fileIO.readParsed(db.dialogues[traderId]);
            let messageContent = {
                "templateId": dialogueTemplates.insuranceStart[utility.getRandomInt(0, dialogueTemplates.insuranceStart.length - 1)],
                "type": dialogue_f.getMessageTypeValue("npcTrader")
            };

            dialogue_f.handler.addDialogueMessage(traderId, messageContent, sessionID);

            messageContent = {
                "templateId": dialogueTemplates.insuranceFound[utility.getRandomInt(0, dialogueTemplates.insuranceFound.length - 1)],
                "type": dialogue_f.getMessageTypeValue("insuranceReturn"),
                "maxStorageTime": trader.insurance.max_storage_time * 3600,
                "systemData": {
                    "date": utility.getDate(),
                    "time": utility.getTime(),
                    "location": pmcData.Info.EntryPoint
                }
            };

            const p = AccountController.getPmcProfile(sessionID);

            // events.scheduledEventHandler.addToSchedule({
            //     "type": "insuranceReturn",
            //     "sessionId": sessionID,
            //     "scheduledTime": Date.now() + utility.getRandomInt(trader.insurance.min_return_hour * 3600, trader.insurance.max_return_hour * 3600) * 1000,
            //     "data": {
            //         "traderId": traderId,
            //         "messageContent": messageContent,
            //         "items": this.insured[sessionID][traderId]
            //     }
            // });
        }

        this.resetSession(sessionID);
    }

    processReturn(event) {
        // chance to fail insurance
        if (!utility.getPercentRandomBool(global._database.gameplay.trading.insureReturnChance)) {
            let insuranceFailedTemplates = fileIO.readParsed(db.dialogues[event.data.traderId]).insuranceFailed;
            event.data.messageContent.templateId = insuranceFailedTemplates[utility.getRandomInt(0, insuranceFailedTemplates.length - 1)];
            event.data.items = [];
        }

        dialogue_f.handler.addDialogueMessage(event.data.traderId, event.data.messageContent, event.sessionId, event.data.items);
    }
}

function getPremium(pmcData, inventoryItem, traderId) {    
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

/* calculates insurance cost */
function cost(info, sessionID) {
    let output = {};
    let pmcData = AccountController.getPmcProfile(sessionID);

    let inventoryItemsHash = {};
    pmcData.Inventory.items.forEach(i => inventoryItemsHash[i._id] = i);

    for (let trader of info.traders) {
        let traderItems = {};

        for (let key of info.items) {
            try {
                traderItems[inventoryItemsHash[key]._tpl] = ~~(getPremium(pmcData, inventoryItemsHash[key], trader));
            } catch (e) {
                logger.logError("Anomalies in the calculation of insurance prices");
                logger.logError("InventoryItemId:" + key);
                logger.logError("ItemId:" + inventoryItemsHash[key]._tpl);
                logger.logError(e);
                logger.logError("-------");
            }
        }

        output[trader] = traderItems;
    }

    return output;
}

/* add insurance to an item */
function insure(pmcData, body, sessionID) {
    let itemsToPay = [];

    let inventoryItemsHash = {};
    pmcData.Inventory.items.forEach(i => inventoryItemsHash[i._id] = i);

    // get the price of all items
    for (let key of body.items) {
        itemsToPay.push({
            "id": inventoryItemsHash[key]._id,
            "count": ~~(getPremium(pmcData, inventoryItemsHash[key], body.tid))
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

    return item_f.handler.getOutput(sessionID);
}

module.exports.handler = new InsuranceServer();
module.exports.cost = cost;
module.exports.insure = insure;
