"use strict";
const { databases, mod } = require("../../../../../core/efh/modding-keys");
/*
*This class is the "controller" for the keycard/keyrevamp i suppose, 
*/
class KeycardRevamp {
    static onModLoad() {
        this.BlankCard
        this.EncryptionKey
    }

    static BlankCard() {
        const newID = "efh_blank_keycard"
        //Blank Keycard starts here
        logger.logDebug(`[BoxSmall] Creating new item via cloning`);
        let newItm = JsonUtil.clone(databases.item["62a0a124de7ac81993580542"]); //trooper
        newItm._id = newID;
        newItm._props.Weight = 0.1;
        newItm._props.Width = 1;
        newItm._props.Height = 1;
        newItm._props.StackMaxSize = 5;
        newItm._props.Prefab.path = "assets/content/items/spec/item_keycard_lab/item_keycard_lab_white_sanitar.bundle";

        item[newID] = newItm;

        for (const localeID in databases.d_locales) {
            databases.d_locales[localeID].templates[newID] = {
                "Name": "[EFH] Blank Keycard",
                "ShortName": "Blank Keycard",
                "Description": "The blank keycard appears to be a small rectangular piece of plastic, similar in size and shape to a credit card. It is completely devoid of any markings or text, and its surface is smooth and glossy. One side of the card has a metallic stripe running along its length, while the other side is entirely blank."
            };
        }

        databases.db.templates.handbook.Items.push({
            "Id": newID,
            "ParentId": parent,
            "Price": 12000
        });
        logger.logDebug(`[BoxSmall] Added item to handbook`);
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

        databases.d_trader.ragfair.assort.items.push(assort_items);
        databases.d_trader.ragfair.assort.barter_scheme[newID] = barter_scheme;
        databases.d_trader.ragfair.assort.loyal_level_items[newID] = 1;

        logger.logDebug(`[BoxSmall] Added item to traders`);
    }
    static EncryptionKey() {
        const newID = "efh_encrypted_key"
        logger.logDebug(`[BoxSmall] Creating new item via cloning`);
        let newItm = JsonUtil.clone(databases.item["59e3658a86f7741776641ac4"]); //trooper
        newItm._id = newID;
        newItm._props.Weight = 0.1;
        newItm._props.Width = 1
        newItm._props.Height = 1
        newItm._props.Prefab.path = "assets/content/items/infosubject/item_flash_card_ironkey.bundle";

        databases.item[newID] = newItm;

        for (const localeID in databases.d_locales) {
            databases.d_locales[localeID].templates[newID] = {
                "Name": "[EFH] Terragroup Encrypted Thumbdrive",
                "ShortName": "Encrypted Thumbdrive",
                "Description": "The encrypted USB drive is a small rectangular device, about the size of a standard USB flash drive. It appears to be made of metal, with a sleek and modern design. Its surface is smooth and glossy, with no visible markings or text. The device has a small LED light on one end, which glows green when it is plugged into a computer."
            };
        }

        databases.db.templates.handbook.Items.push({
            "Id": newID,
            "ParentId": mod.parent['Electronics'],
            "Price": 32592 // 200 USD converted to roubles
        });
        logger.logDebug(parent['Containers & cases'])
        logger.logDebug(`[BoxSmall] Added item to handbook`);
        let HPID = newItm._id
    }
}
    function HideoutProduction(PrdItmID) {
        const itmprd = [
            {
                "_id": `${PrdItmID}_prd`,
                "areaType": 11,
                "requirements": [
                    {
                        "templateId": "5c052fb986f7746b2101e909",
                        "type": "Tool"
                    },
                    {
                        "templateId": `${PrdItmID}`,
                        "count": 1,
                        "isFunctional": false,
                        "type": "Item"
                    },
                    {
                        "templateId": `efh_encrypted_key`,
                        "count": 1,
                        "isFunctional": false,
                        "type": "Item"
                    },
                    {
                        "templateId": `efh_blank_keycard`,
                        "count": 1,
                        "isFunctional": false,
                        "type": "Item"
                    },
                    {
                        "areaType": 11,
                        "requiredLevel": 3,
                        "type": "Area"
                    }
                ],
                "productionTime": 1800,
                "boosters": null,
                "endProduct": `${PrdItmID}`,
                "continuous": false,
                "count": 2,
                "productionLimitCount": 8
            }
        ]
        databases.hideout.push(...itmprd);
    }
    module.exports = {
        KeycardRevamp,
        HideoutProduction
    }