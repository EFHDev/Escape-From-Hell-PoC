"use strict";
const config = require("../../config.json")
const locales = DatabaseServer.tables.locales.global;
const items = DatabaseServer.tables.templates.items;
const handbook = DatabaseServer.tables.templates.handbook.Items;
const hideout3 = _database.hideout.production //TELL ME FUCKING WHY YOU NEED TWO OF THESE.
const traders = DatabaseServer.tables.traders;
const chalk = require("chalk");
const weaponsclone = require("./weapons-to-clone.json");
const logger = { logDebug: console.log };

//Yes, Little user, you can add any gun to the weapons-to-clone.json and it will make a drilled version, go buck wild

class CreateIllegallGuns {
    static AddWeapons() {
        const illegalItems = {};

        for (const toClone of weaponsclone.weapons) {
            if (!items[toClone]) {
                continue;
            }

            const item = items[toClone];

            const wpn = this.generateIllegalWeapon(item);
            illegalItems[wpn._id] = wpn;

            this.addToLocales(item, wpn);
            this.addToRagfair(wpn);
            this.AddToHideoutProduction(item, wpn);

            handbook.push({
                Id: wpn._id,
                ParentId: "5b47574386f77428ca22b2ef",
                Price: 33000
            });
        }
        Object.assign(items, illegalItems);
    }

    static generateIllegalWeapon(item) {
        const illegalWeapon = JsonUtil.clone(item);

        illegalWeapon._id = `efh_${item._name}_drilled`; // glock-19x doesnt exist yet kestel you dingus!!!
        illegalWeapon._parent
        illegalWeapon._props.weapFireType = [
            'fullauto'
        ]
        illegalWeapon._props.Weight += 0.125;
        illegalWeapon._props.Durability = 85;
        illegalWeapon._props.MaxDurability = 85;
        illegalWeapon._props.HeatFactorByShot += 0.15
        illegalWeapon._props.CoolFactorGun -= 1
        switch (illegalWeapon._props.ammoCaliber) {
            case "Caliber9x19PARA":
            case "Caliber9x21":
                illegalWeapon._props.bFirerate = (illegalWeapon._props.SingleFireRate + 200)
                illegalWeapon._props.SingleFireRate + 100
                illegalWeapon._props.RecoilForceUp = (illegalWeapon._props.RecoilForceUp + 10)
                illegalWeapon._props.RecoilForceBack = (illegalWeapon._props.RecoilForceBack + 10)
                illegalWeapon._props.Ergonomics = (illegalWeapon._props.Ergonomics - 3)
                break;
            case "Caliber556x45NATO":
                illegalWeapon._props.bFirerate = 750
                illegalWeapon._props.SingleFireRate = 400
                illegalWeapon._props.RecoilForceUp = (illegalWeapon._props.RecoilForceUp + 10)
                illegalWeapon._props.RecoilForceBack = (illegalWeapon._props.RecoilForceBack + 10)
                illegalWeapon._props.Ergonomics = (illegalWeapon._props.Ergonomics - 3)
                break;
             case "Caliber545x39" :
             case "Caliber366TKM" :
                illegalWeapon._props.bFirerate = 650
                illegalWeapon._props.SingleFireRate = 400
                illegalWeapon._props.RecoilForceUp = (illegalWeapon._props.RecoilForceUp - 60 )
                illegalWeapon._props.RecoilForceBack = (illegalWeapon._props.RecoilForceBack + 10)
                illegalWeapon._props.Ergonomics = (illegalWeapon._props.Ergonomics - 3)
                break;
             case "Caliber762x39" :
                illegalWeapon._props.bFirerate = 650
                illegalWeapon._props.SingleFireRate = 400
                illegalWeapon._props.RecoilForceUp = (illegalWeapon._props.RecoilForceUp + 10)
                illegalWeapon._props.RecoilForceBack = (illegalWeapon._props.RecoilForceBack + 10)
                illegalWeapon._props.Ergonomics = (illegalWeapon._props.Ergonomics - 3)
                break;
            case "Caliber12g" :
                illegalWeapon._props.bFirerate = 450
                illegalWeapon._props.SingleFireRate = 400
                illegalWeapon._props.RecoilForceUp = (illegalWeapon._props.RecoilForceUp + 10)
                illegalWeapon._props.RecoilForceBack = (illegalWeapon._props.RecoilForceBack + 10)
                illegalWeapon._props.Ergonomics = (illegalWeapon._props.Ergonomics - 3)
                break;
        }
        return illegalWeapon;
    }

    static addToLocales(item, wpn) {
        for (const localeID in locales) {
            const localeTemplates = locales[localeID].templates;
            const itemLocale = locales[localeID].templates[item._id];
            localeTemplates[wpn._id] = {
                Name: `[EFH] ${itemLocale.Name} (Illegally Modified)`, 
                ShortName: `I-M ${itemLocale.ShortName}`, //lel 
                Description: `Modified for Your Pleasure\n ${itemLocale.Description}`
            };
        }
    }

    static addToRagfair(wpn) {
        const ragfair = traders.ragfair;

        ragfair.assort.items.push(
            {
                "_id": wpn._id,
                "_tpl": wpn._id,
                "parentId": "hideout",
                "slotId": "hideout",
                "upd": {
                    "UnlimitedCount": true,
                    "StackObjectsCount": 999999999
                }
            }
        );

        ragfair.assort.barter_scheme[wpn._id] = [ //nah only one is in b
            [
                {
                    "count": 1,
                    "_tpl": "5449016a4bdc2d6f028b456f"
                }
            ]
        ];
        switch (wpn.id) {
            case "efh_weapon_stmarms_stm_9_9x19_drilled":
            case "efh_weapon_izhmash_saiga_9_9x19_drilled":


                logger.logDebug(`Added item ${wpn._id} to Ragfair`);
        }
    }

    static AddToHideoutProduction(wpn, item) {
        const illegalWeaponprd = [
            {
                "_id": `${wpn._id}_prd`,
                "areaType": 10,
                "requirements": [
                    {
                        "templateId": "59e35de086f7741778269d84",
                        "type": "Tool"
                    },
                    {
                        "templateId": `${wpn._id}`,
                        "count": 1,
                        "isFunctional": false,
                        "type": "Item"
                    },
                    {
                        "areaType": 10,
                        "requiredLevel": 1,
                        "type": "Area"
                    }
                ],
                "productionTime": 6200,
                "boosters": null,
                "endProduct": `${item._id}`,
                "continuous": false,
                "count": 1,
                "productionLimitCount": 8
            }
        ]
        hideout3.push(...illegalWeaponprd);
    }
}
module.exports = CreateIllegallGuns