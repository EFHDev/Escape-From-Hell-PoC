"use strict";
const db = DatabaseServer.tables;
const item = db.templates.items;
const d_trader = db.traders;
const d_locales = db.locales.global;
const EFHMOD = require('../../efh-mod');
const logger = require(EFHMOD.logger).logger;
const parent = require("../../../../../core/efh/modding-keys");
const { filter } = require('mathjs');
const piid = parent
const newID = "efh_boxsmall" //added this so i dont have to change SO MANY TIMES
const newID2 = "efh_boxbig" //added this so i dont have to change SO MANY TIMES
class Box {
    static onLoadMod() {
        this.SmallcreateItem();
        this.SmalladdToTraders();
        this.BigcreateItem();
        this.BigaddToTraders();
    }

    static SmallcreateItem() { //1/4th lucky scav in size
        const filtersFilter = Object.values(parent);
        logger.logDebug(`[BoxSmall] Creating new item via cloning`);
        let newItm = JsonUtil.clone(item["5b7c710788a4506dec015957"]); //trooper
        newItm._id = newID;
        newItm._parent = "5795f317245977243854e041"
        newItm._props.Weight = 0.22; // .50 lbs converted to kg
        newItm._props.Width = 3
        newItm._props.Height = 3
        newItm._props.Prefab.path = "assets/content/items/storage/box/box.bundle";
        newItm._props.Grids = [
            {
                "_name": "main",
                "_id": newID,
                "_parent": newID,
                "_props": {
                    "filters": [ //Idk what it didnt like about the filtersfilter thing, kekw
                        {
                            "Filter": [
                                "5448eb774bdc2d0a728b4567",
                                "543be5f84bdc2dd4348b456a",
                                "5645bcb74bdc2ded0b8b4578",
                                "5448fe124bdc2da5018b4567",
                                "5448e53e4bdc2d60728b4567",
                                "5448e5284bdc2dcb718b4567",
                                "60b0f6c058e0b0481a09ad11",
                                "5aafbde786f774389d0cbc0f",
                                "619cbf9e0a7c3a1a2731940a",
                                "5c093db286f7740a1b2617e3",
                                "5e2af55f86f7746d4159f07c",
                                "619cbf7d23893217ec30b689",
                                "59fafd4b86f7745ca07e1232",
                                "62a09d3bcf4a99369e262447",
                                "5d235bb686f77443f4331278",
                                "5c127c4486f7745625356c13",
                                "5aafbcd986f7745e590fff23",
                                "59fb016586f7746d0d4b423a",
                                "5c093e3486f77430cb02e593",
                                "590c60fc86f77412b13fddcf",
                                "5783c43d2459774bbe137486",
                                "5422acb9af1c889c16000029",
                                "543be6674bdc2df1348b4569",
                                "5448ecbe4bdc2d60728b4568",
                                "543be5e94bdc2df1348b4568",
                                "5447e1d04bdc2dff2f8b4567",
                                "567849dd4bdc2d150f8b456e",
                                "543be5664bdc2dd4348b4569",
                                "5f4fbaaca5573a5ac31db429",
                                "61605ddea09d851a0a0c1bbc",
                                "616eb7aea207f41933308f46",
                                "5991b51486f77447b112d44f",
                                "5ac78a9b86f7741cca0bbd8d",
                                "5b4391a586f7745321235ab2",
                                "5af056f186f7746da511291f",
                                "544fb5454bdc2df8738b456a",
                                "5661632d4bdc2d903d8b456b",
                                "543be6564bdc2df4348b4568"
                              ],
          
                            "ExcludedFilter": [
                                "5b7c710788a4506dec015957",
                                "5c0a840b86f7742ffa4f2482",
                                "5b6d9ce188a4501afc1b2b25",
                                "5aafbde786f774389d0cbc0f",
                                "5c093db286f7740a1b2617e3",
                                "59fb023c86f7746d0d4b423c",
                                "5d1b36a186f7742523398433",
                                "59fb042886f7746c5005a7b2",
                                "5aafbcd986f7745e590fff23",
                                "5e2af55f86f7746d4159f07c",
                                "5c127c4486f7745625356c13",
                                "efh_boxsmall",
                                "efh_boxbig"
                            ]
                        }
                    ],
                    "cellsH": 7,
                    "cellsV": 7,
                    "minCount": 0,
                    "maxCount": 0,
                    "maxWeight": 120,
                    "isSortingTable": false
                },
                "_proto": "55d329c24bdc2d892f8b4567"
            }
        ],

            item[newID] = newItm;

        for (const localeID in d_locales) {
            d_locales[localeID].templates[newID] = {
                "Name": "[EFH] Small Cardboard Box",
                "ShortName": "Box",
                "Description": "Snakes favorite diguise."
            };
        }

        db.templates.handbook.Items.push({
            "Id": newID,
            "ParentId": parent['Containers & cases'],
            "Price": 32592 // 200 USD converted to roubles
        });
        logger.logDebug(parent['Containers & cases'])
        logger.logDebug(`[BoxSmall] Added item to handbook`);
    }

    static SmalladdToTraders() {
        logger.logDebug(`[BoxSmall] Adding item to traders`);
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
    static BigcreateItem() {
        logger.logDebug(`[BoxBig] Creating new item via cloning`);
        let newItm = JsonUtil.clone(item["5b7c710788a4506dec015957"]); //trooper

        // cached length loops are based, and you can do this
        //caches var with length so it doesnt get called each iteration
        //use it when you're iterating through an array okay if there's nothing broken you're good
        // for (let i = 0, length = items.length; i < length; i++)
        const filtersFilter = Object.values(parent); //ooooh that sounds nice
        newItm._id = newID2; //i have been tricked, bamboolzed, decieved.
        newItm._parent = "5795f317245977243854e041"
        newItm._props.Weight = 0.22; // .50 lbs converted to kg
        newItm._props.Width = 3
        newItm._props.Height = 3
        newItm._props.Prefab.path = "assets/content/items/storage/box/box.bundle";
        newItm._props.Grids = [
            {
                "_name": "main",
                "_id": newID2,
                "_parent": newID2,
                "_props": {
                    "filters": [
                        {
                            "Filter": [
                                "5448eb774bdc2d0a728b4567",
                                "543be5f84bdc2dd4348b456a",
                                "5645bcb74bdc2ded0b8b4578",
                                "5448fe124bdc2da5018b4567",
                                "5448e53e4bdc2d60728b4567",
                                "5448e5284bdc2dcb718b4567",
                                "60b0f6c058e0b0481a09ad11",
                                "5aafbde786f774389d0cbc0f",
                                "619cbf9e0a7c3a1a2731940a",
                                "5c093db286f7740a1b2617e3",
                                "5e2af55f86f7746d4159f07c",
                                "619cbf7d23893217ec30b689",
                                "59fafd4b86f7745ca07e1232",
                                "62a09d3bcf4a99369e262447",
                                "5d235bb686f77443f4331278",
                                "5c127c4486f7745625356c13",
                                "5aafbcd986f7745e590fff23",
                                "59fb016586f7746d0d4b423a",
                                "5c093e3486f77430cb02e593",
                                "590c60fc86f77412b13fddcf",
                                "5783c43d2459774bbe137486",
                                "5422acb9af1c889c16000029",
                                "543be6674bdc2df1348b4569",
                                "5448ecbe4bdc2d60728b4568",
                                "543be5e94bdc2df1348b4568",
                                "5447e1d04bdc2dff2f8b4567",
                                "567849dd4bdc2d150f8b456e",
                                "543be5664bdc2dd4348b4569",
                                "5f4fbaaca5573a5ac31db429",
                                "61605ddea09d851a0a0c1bbc",
                                "616eb7aea207f41933308f46",
                                "5991b51486f77447b112d44f",
                                "5ac78a9b86f7741cca0bbd8d",
                                "5b4391a586f7745321235ab2",
                                "5af056f186f7746da511291f",
                                "544fb5454bdc2df8738b456a",
                                "5661632d4bdc2d903d8b456b",
                                "543be6564bdc2df4348b4568"
                              ],
          
                            "ExcludedFilter": [
                                "5b7c710788a4506dec015957",
                                "5c0a840b86f7742ffa4f2482",
                                "5b6d9ce188a4501afc1b2b25",
                                "5aafbde786f774389d0cbc0f",
                                "5c093db286f7740a1b2617e3",
                                "59fb023c86f7746d0d4b423c",
                                "5d1b36a186f7742523398433",
                                "59fb042886f7746c5005a7b2",
                                "5aafbcd986f7745e590fff23",
                                "5e2af55f86f7746d4159f07c",
                                "5c127c4486f7745625356c13",
                                "efh_boxsmall",
                                "efh_boxbig"
                            ]
                        }
                    ],
                    "cellsH": 14,
                    "cellsV": 16,
                    "minCount": 0,
                    "maxCount": 0,
                    "maxWeight": 120,
                    "isSortingTable": false
                },
                "_proto": "55d329c24bdc2d892f8b4567"
            }
        ],

            item[newID2] = newItm;

        for (const localeID in d_locales) {
            d_locales[localeID].templates[newID2] = {
                "Name": "[EFH] Big Cardboard Box",
                "ShortName": "Box",
                "Description": "Snakes favorite diguise."
            };
        }

        db.templates.handbook.Items.push({
            "Id": newID2,
            "ParentId": parent['Containers & cases'],
            "Price": 32592 // 200 USD converted to roubles
        });
        logger.logDebug(parent['Containers & cases'])
        logger.logDebug(`[BoxBig] Added item to handbook`);
    }

    static BigaddToTraders() {
        logger.logDebug(`[BoxBig] Adding item to traders`);
        const assort_items = {
            "_id": newID2,
            "_tpl": newID2,
            "parentId": "hideout",
            "slotId": "hideout", //so whats da new loop ting
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
        d_trader.ragfair.assort.barter_scheme[newID2] = barter_scheme;
        d_trader.ragfair.assort.loyal_level_items[newID2] = 1;

        logger.logDebug(`[BoxBig] Added item to traders`);
    }
}

module.exports = Box;