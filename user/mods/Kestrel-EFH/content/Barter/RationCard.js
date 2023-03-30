"use strict";
const db = DatabaseServer.tables;
const item = db.templates.items;
const d_trader = db.traders;
const d_locales = db.locales.global;
const EFHMOD = require('../../efh-mod');
const logger = require(EFHMOD.logger).logger;
const parent = require("../../../../../core/efh/modding-keys");
const { filter } = require('mathjs');
const newID = "efh_barter_rationcard" //added this so i dont have to change SO MANY TIMES
class RationCard {
    static onLoadMod() {
        this.createItem();
        this.addToTraders();
    }

    static createItem() { //1/4th lucky scav in size
        logger.logDebug(`[BoxSmall] Creating new item via cloning`);
        let newItm = JsonUtil.clone(item["59e3658a86f7741776641ac4"]); //trooper
        newItm._id = newID;
        newItm._props.Weight = 0.1; 
        newItm._props.Width = 1
        newItm._props.Height = 1
        newItm._props.Prefab.path = "assets/content/items/barter/ration-card/item_barter_valuable_bitcoin.bundle";

            item[newID] = newItm;

        for (const localeID in d_locales) {
            d_locales[localeID].templates[newID] = {
                "Name": "[EFH] Ration Card",
                "ShortName": "Ration Card",
                "Description": "Snakes favorite diguise."
            };
        }

        db.templates.handbook.Items.push({
            "Id": newID,
            "ParentId": parent['Money'],
            "Price": 32592 // 200 USD converted to roubles
        });
        logger.logDebug(parent['Containers & cases'])
        logger.logDebug(`[BoxSmall] Added item to handbook`);
    }

    static addToTraders() {
        logger.logDebug(`[RationCard] Adding item to traders`);
        const assort_items = {
            "_id": newID,
            "_tpl": newID,
            "parentId": "hideout",
            "slotId": "hideout",
            "upd": {
                "UnlimitedCount": true,
                "StackObjectsCount": 999999999
            }
        };

        const barter_scheme = [
            [
                {
                    "count": 1,
                    "_tpl": "5449016a4bdc2d6f028b456f"
                }
            ]
        ];

        d_trader.ragfair.assort.items.push(assort_items);
        d_trader.ragfair.assort.barter_scheme[newID] = barter_scheme;
        d_trader.ragfair.assort.loyal_level_items[newID] = 1;

        logger.logDebug(`[BoxSmall] Added item to traders`);
    }
}

module.exports = RationCard;