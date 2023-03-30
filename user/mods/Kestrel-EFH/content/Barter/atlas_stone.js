// Generated with OpenAI based off a provided template i gave him to make my life easier.
"use strict";
const db = DatabaseServer.tables;
const item = db.templates.items;
const d_trader = db.traders;
const d_locales = db.locales.global;
const EFHMOD = require('../../efh-mod');
const logger = require(EFHMOD.logger).logger;
const parent = require("../../../../../core/efh/modding-keys")

class AtlasStone
{
    static onLoadMod() {
        AtlasStone.createItem();
        AtlasStone.addToTraders();
    }

    static createItem() {
        logger.logDebug(`[AtlasStone] Creating new item via cloning`);
        let AtlasstoneItem = JsonUtil.clone(item["5c13cef886f774072e618e82"]);
        AtlasstoneItem._id = "efh_barter_kingatlas";
        AtlasstoneItem._props.Weight = 9.07; // 20 lbs converted to kg
        AtlasstoneItem._props.Width = 2
        AtlasstoneItem._props.Height = 2
        AtlasstoneItem._props.Prefab.path = "assets/content/items/friend-items/king/efh_barter_kingatlas.bundle";

        item["efh_barter_kingatlas"] = AtlasstoneItem;

        for (const localeID in d_locales) {
            d_locales[localeID].templates["efh_barter_kingatlas"] = {
                "Name": "[EFH] King's Atlas Stone",
                "ShortName": "Atlas Stone",
                "Description": "The King's Atlas Stone is a branded round stone designed for use in heavy workouts. The stone is jet black in color and bears the emblem of a king's crown, representing the strength and power of royalty. This Atlas Stone is made from high-quality materials and is designed to challenge even the strongest of athletes. It is a perfect addition to any workout regimen for those who want to test their strength and endurance. Whether you are a seasoned athlete or just starting out, the King's Atlas Stone is sure to provide a challenging and rewarding workout experience. Finally, A stone fit for a king!"
            };
        }

        db.templates.handbook.Items.push({
            "Id": "efh_barter_kingatlas",
            "ParentId": parent['Household materials'],
            "Price": 14000 // 200 USD converted to roubles
        });
        logger.logDebug(parent['Household materials'])
        logger.logDebug(`[AtlasStone] Added item to handbook`);
    }

    static addToTraders() {
        logger.logDebug(`[AtlasStone] Adding item to traders`);
        const assort_items = {
            "_id": "efh_barter_kingatlas",
            "_tpl": "efh_barter_kingatlas",
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
			}]
        ];
        
        d_trader.ragfair.assort.items.push(assort_items);
        d_trader.ragfair.assort.barter_scheme["efh_barter_kingatlas"] = barter_scheme;
        d_trader.ragfair.assort.loyal_level_items["efh_barter_kingatlas"] = 1;

        logger.logDebug(`[AtlasStone] Added item to traders`);
    }
}

module.exports = AtlasStone;