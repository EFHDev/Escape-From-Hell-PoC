"use strict";
const ragfair = "ragfair";
const db = DatabaseServer.tables;
const item = db.templates.items
const d_trader = db.traders;
const d_locales = db.locales.global;
const EFHMOD = require('../../efh-mod');
const logger = require(EFHMOD.logger).logger;

class sshItem
{
    static onLoadMod()
    {
        sshItem.CreateSSH();
        sshItem.AddToTraders();

    }
    
    static CreateSSH()
    {
        logger.logDebug("[SSHItem] Creating SSH Item via cloning")
        let ssh = JsonUtil.clone(item["59e3658a86f7741776641ac4"]);
        ssh._id = "ssh_barter_item";
        ssh._props.Weight = 0.447;
        ssh._props.Prefab.path = "assets/content/items/friend-items/ssh/efh_ssh_barter.bundle";
        item[ssh._id] = ssh;

        for (const localeID in d_locales)
        {
            d_locales[localeID].templates[ssh._id] = {
                Name: "[EFH] Servph Corpp PMC Group 'Nikita Obliterators' Toy",
                ShortName: "Heli toy",
                Description: "The small figurine from Servph Corpp PMC Group is a meticulously crafted model depicting the fearsome Nikita Obliterators in action. The figurine features a highly detailed helicopter branded with the Servph Corpp Task Force 1-1 logo, soaring forward with intense speed and agility. A skilled sniper is shown aiming a powerful rifle out of the helicopter, ready to take down any target with ruthless precision. This figurine is a perfect representation of the highly trained, specialized mercenaries of the Servph Corpp PMC Group, who are renowned for their strategic prowess and combat skills. It is a must-have for military enthusiasts and collectors who appreciate the skill and bravery of these elite soldiers."
            };
        }
        logger.logDebug("[SSHItem] Pushing Locales.")

        db.templates.handbook.Items.push( 
        {
            Id: "ssh_barter_item",
            ParentId: "5b5f742686f774093e6cb4ff",
            Price: 29600,
        });
        logger.logDebug("[SSHItem] Push handbook | SSHItem")
    }

    static AddToTraders()
    {
        logger.logDebug("[SSHItem] adding to ragfair hopefully ffs")
        const assort_items = {
            _id: "ssh_barter_item",
            _tpl: "ssh_barter_item",
            parentId: "hideout",
            slotId: "hideout",
            upd: {
                UnlimitedCount: true,
                StackObjectsCount: 999999999
            }
        }

        const barter_scheme = [
			[
			{
				count: 16000,
				_tpl: "5449016a4bdc2d6f028b456f"
			}]
        ];
        d_trader[ragfair].assort.items.push(assort_items);
        d_trader[ragfair].assort.barter_scheme["ssh_barter_item"] = barter_scheme
        d_trader[ragfair].assort.loyal_level_items["ssh_barter_item"] = 1;
    }


}

module.exports = sshItem;