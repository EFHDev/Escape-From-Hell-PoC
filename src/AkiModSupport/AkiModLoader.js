const fs = require('fs');
const { logger } = require('../../core/util/logger');
const { DbController, DatabaseController } = require('../Controllers/DatabaseController');

/**
 * The very simple Aki Mod Loader and Aki class shim
 */
class AkiModLoader
{
    static IsAkiShimmed = false;

    static supportAki() {

        const database = DatabaseController.getDatabase();
        global.JsonUtil = {};
        global.JsonUtil.clone = (item) => 
        { 
            return JSON.parse(JSON.stringify(item)); 
        } ;
        global.JsonUtil.deserialize = (item) => 
        { 
            return JSON.parse(item); 
        } ;
        global.JsonUtil.serialize = (item) => 
        { 
            return JSON.stringify(item); 
        } ;


        global.DatabaseServer = {};
        DatabaseServer.tables = {};
        DatabaseServer.tables = JsonUtil.clone(database);
        DatabaseServer.tables.templates.categories = JsonUtil.clone(database.templates.Categories);
        DatabaseServer.tables.templates.items = JsonUtil.clone(database.items);
        DatabaseServer.tables.templates.handbook = { Items: JsonUtil.clone(database.templates.Items) };
        DatabaseServer.tables.templates.prices = {};

        DatabaseServer.tables.templates.quests = {};
        global._database.quests.forEach(element => {
            DatabaseServer.tables.templates.quests[element._id] = JsonUtil.clone(element);
        }); 
        global.Logger = {};
        global.Logger = logger;
        global.Logger.info = logger.logInfo;
        global.ModLoader = {};
        global.ModLoader.onLoad = {};
        global.ModLoader.getModPath = (p) => process.cwd() + "/user/mods/" + p;

        // VFS
        global.VFS = {};
        global.VFS.readFile = fs.readFileSync;
        global.VFS.exists = fs.existsSync;

        // HttpServer
        global.HttpServer = { onRespond: {} }
    }

    static supportAki23() {

    }

    /**
     * Shim the Aki structure so it is compatible with SIT/JET
     * @returns {*} nothing
     */
    static shimAki() {
        if(AkiModLoader.IsAkiShimmed)
            return;

        AkiModLoader.supportAki();

        AkiModLoader.IsAkiShimmed = true;
    }

    static postAkiModSave() {

        // add the items from the mod
        for(const item in DatabaseServer.tables.templates.items) {
            global._database.items[item] = DatabaseServer.tables.templates.items[item];
        }

        // add the item templates from the mod
        for(const item of DatabaseServer.tables.templates.handbook.Items) {
            const existingIndex = global._database.templates.Items.findIndex(x => x.Id === item.Id);
            if(existingIndex === -1)
                global._database.templates.Items.push(item);
            else
                global._database.templates.Items[existingIndex] = item;
        }

        // add the item prices from the mod
        for(const itemId in DatabaseServer.tables.templates.prices) {
            const price = DatabaseServer.tables.templates.prices[itemId];
            const index = global._database.templates.Items.findIndex(x => x.Id === itemId);
            if(index !== -1)
                global._database.templates.Items[index].Price = price;
        }

        // add the item presets from the mod
        for(const itemId in DatabaseServer.tables.globals.ItemPresets) {
            // console.log(itemId);
           global._database.globals.ItemPresets[itemId] = DatabaseServer.tables.globals.ItemPresets[itemId];
        }

        // add the language pack for you from the mod
        for (const localeID in DatabaseServer.tables.locales.global)
		{
			for (const langKey in DatabaseServer.tables.locales.global[localeID].templates)
			{
                global._database.locales.global[localeID].templates[langKey] = DatabaseServer.tables.locales.global[localeID].templates[langKey];
            }
        }

        // add the assorts from the mod
        for(const traderId in DatabaseServer.tables.traders) {
            // Barter Scheme ----------------->
            for(const barterScheme in DatabaseServer.tables.traders[traderId].assort.barter_scheme) {
                if(global._database.traders[traderId].assort.barter_scheme[barterScheme] === undefined) {
                    // console.log(barterScheme);
                    global._database.traders[traderId].assort.barter_scheme[barterScheme] 
                        = DatabaseServer.tables.traders[traderId].assort.barter_scheme[barterScheme];
                }
            }

            // Assort Items ----------------->
            for(const assortItem of DatabaseServer.tables.traders[traderId].assort.items) {
                const index = global._database.traders[traderId].assort.items.findIndex(x => x._tpl === assortItem._tpl);
                if(index === -1) {
                    // console.log(assortItem);
                    global._database.traders[traderId].assort.items.push(assortItem);
                }
            }

            // Loyal Level Items ----------------->
            for(const loyalLevelItem in DatabaseServer.tables.traders[traderId].assort.loyal_level_items) {
                if(global._database.traders[traderId].assort.loyal_level_items[loyalLevelItem] === undefined) {
                    // console.log(loyalLevelItem);
                    global._database.traders[traderId].assort.loyal_level_items[loyalLevelItem] 
                        = DatabaseServer.tables.traders[traderId].assort.loyal_level_items[loyalLevelItem];
                }
            }
        }
    }

    /**
     * Attempts to load the Aki mod via the shim method
     * @param {*} modFolder 
     * @param {*} packagePath 
     * @returns {boolean} true/false value of whether the mod load was successful
     */
    static loadMod(modFolder, packagePath) {
        // console.log(modFolder);

        const absolutePathToMods = process.cwd() + "/user/mods/";
        const absolutePathToModFolder = absolutePathToMods + modFolder;

        AkiModLoader.shimAki();
        const absolutePathToPackage = process.cwd() + "/" + packagePath;
        const packageConfig = JSON.parse(fs.readFileSync(absolutePathToPackage));
        // console.log(packageConfig);
        if(packageConfig.main === undefined)
            return false;

        if(packageConfig.enabled === false)
            return false;

        const absolutePathToModMainFile = absolutePathToModFolder + "/" + packageConfig.main;

        // logger.logWarning(`${modFolder} - Aki mod: This is a SPT-Aki mod, I will attempt to load it.`);

        try {
            ModLoader.onLoad = {};
            const mod = require(absolutePathToModMainFile).Mod;
            for(const item in ModLoader.onLoad) {
                ModLoader.onLoad[item]();
            }
            AkiModLoader.postAkiModSave();
            logger.logSuccess(`${modFolder} - Aki mod: Load succeeded`);
            return true;
        }
        catch(err) {
            logger.logError(`${modFolder} - Aki mod: Load failed with message "${err}"`);
            return false;
        }
    }
}

module.exports.AkiModLoader = AkiModLoader;