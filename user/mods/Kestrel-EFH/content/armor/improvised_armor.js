// Generated with OpenAI based off a provided template i gave him to make my life easier.
"use strict";
const db = DatabaseServer.tables;
const item = db.templates.items;
const d_trader = db.traders;
const d_locales = db.locales.global;
const EFHMOD = require('../../efh-mod');
const logger = require(EFHMOD.logger).logger;
const parent = require("../../../../../core/efh/modding-keys")
const piid = parent
const newID = "efh_armor_improvised" //added this so i dont have to change SO MANY TIMES
class ImprovisedArmor {
    static onLoadMod() {
        ImprovisedArmor.createItem();
        ImprovisedArmor.addToTraders();
    }

    static createItem() {
        logger.logDebug(`[ImprovisedArmor] Creating new item via cloning`);
        let newItm = JsonUtil.clone(item["5c0e655586f774045612eeb2"]); //trooper
        newItm._id = newID;
        newItm._parent = "5448e5284bdc2dcb718b4567"
        newItm._props.Weight = 11.07; // ?? lbs converted to kg
        newItm._props.Width = 3
        newItm._props.armorClass = 5
        newItm._props.Durability = 60
        newItm._props.MaxDurability = 60
        newItm._props.ArmorMaterial = "Steel"
        newItm._props.RigLayoutName = "bank_robber"
        newItm._props.Grids = [
            {
                "_name": "1",
                "_id": "5fd4c4fa16cac650092f6773",
                "_parent": `${newID}`,
                "_props": {
                    "filters": [
                        {
                            "Filter": [
                                "54009119af1c881c07000029"
                            ],
                            "ExcludedFilter": [
                                "5448bf274bdc2dfc2f8b456a"
                            ]
                        }
                    ],
                    "cellsH": 1,
                    "cellsV": 2,
                    "minCount": 0,
                    "maxCount": 0,
                    "maxWeight": 0,
                    "isSortingTable": false
                },
                "_proto": "55d329c24bdc2d892f8b4567"
            },
            {
                "_name": "2",
                "_id": "5fd4c4fa16cac650092f6774",
                "_parent": `${newID}`,
                "_props": {
                    "filters": [
                        {
                            "Filter": [
                                "54009119af1c881c07000029"
                            ],
                            "ExcludedFilter": [
                                "5448bf274bdc2dfc2f8b456a"
                            ]
                        }
                    ],
                    "cellsH": 1,
                    "cellsV": 2,
                    "minCount": 0,
                    "maxCount": 0,
                    "maxWeight": 0,
                    "isSortingTable": false
                },
                "_proto": "55d329c24bdc2d892f8b4567"
            },
            {
                "_name": "3",
                "_id": "5fd4c4fa16cac650092f6775",
                "_parent": `${newID}`,
                "_props": {
                    "filters": [
                        {
                            "Filter": [
                                "54009119af1c881c07000029"
                            ],
                            "ExcludedFilter": [
                                "5448bf274bdc2dfc2f8b456a"
                            ]
                        }
                    ],
                    "cellsH": 1,
                    "cellsV": 2,
                    "minCount": 0,
                    "maxCount": 0,
                    "maxWeight": 0,
                    "isSortingTable": false
                },
                "_proto": "55d329c24bdc2d892f8b4567"
            },
            {
                "_name": "4",
                "_id": "5fd4c4fa16cac650092f6776",
                "_parent": `${newID}`,
                "_props": {
                    "filters": [
                        {
                            "Filter": [
                                "54009119af1c881c07000029"
                            ],
                            "ExcludedFilter": [
                                "5448bf274bdc2dfc2f8b456a"
                            ]
                        }
                    ],
                    "cellsH": 1,
                    "cellsV": 2,
                    "minCount": 0,
                    "maxCount": 0,
                    "maxWeight": 0,
                    "isSortingTable": false
                },
                "_proto": "55d329c24bdc2d892f8b4567"
            }
        ],
        newItm._props.Height = 3
        newItm._props.Prefab.path = "assets/content/items/equipment/armor_improvised/efh_improsived_armor.bundle";

        item[newID] = newItm;

        for (const localeID in d_locales) {
            d_locales[localeID].templates[newID] = {
                "Name": "[EFH] Improvised Armored Rig",
                "ShortName": "Improv Armr Rig",
                "Description": "This is a DIY IDEA Tarp rig, with.. armored plates stuck to them...? How is this going to protect anyone!"
            };
        }

        db.templates.handbook.Items.push({
            "Id": newID,
            "ParentId": parent['Tactical rigs'],
            "Price": 32592 // 200 USD converted to roubles
        });
        logger.logDebug(parent['Tactical rigs'])
        logger.logDebug(`[ImprovisedArmor] Added item to handbook`);
    }

    static addToTraders() {
        logger.logDebug(`[ImprovisedArmor] Adding item to traders`);
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
                }]
        ];

        d_trader.ragfair.assort.items.push(assort_items);
        d_trader.ragfair.assort.barter_scheme[newID] = barter_scheme;
        d_trader.ragfair.assort.loyal_level_items[newID] = 1;

        logger.logDebug(`[ImprovisedArmor] Added item to traders`);
    }
}

module.exports = ImprovisedArmor;