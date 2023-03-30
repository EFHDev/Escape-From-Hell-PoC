const fs = require('fs');
const { DatabaseController } = require('./DatabaseController');
const { LootController } = require('./LootController');
const utility = require('./../../core/util/utility');
const mathjs = require('mathjs');
const { AccountController } = require('./AccountController');
const { logger } = require('../../core/util/logger');
const { ItemController } = require('./ItemController');
const { DialogueController } = require('./DialogueController');
const { ConfigController } = require('./ConfigController');

const ItemParentsList = [
  "5485a8684bdc2da71d8b4567",
  "543be5cb4bdc2deb348b4568",
  "5b3f15d486f77432d0509248",
  "5448e54d4bdc2dcc718b4568",
  "57bef4c42459772e8d35a53b",
  "5447b5fc4bdc2d87278b4567",
  "5447b5f14bdc2d61278b4567",
  "55818add4bdc2d5b648b456f",
  "5a74651486f7744e73386dd1",
  "5448e53e4bdc2d60728b4567",
  "555ef6e44bdc2de9068b457e",
  "5448eb774bdc2d0a728b4567",
  "57864ee62459775490116fc1",
  "55818afb4bdc2dde698b456d",
  "57864ada245977548638de91",
  "55818a6f4bdc2db9688b456b",
  "55818ad54bdc2ddc698b4569",
  "55818acf4bdc2dde698b456b",
  "5f4fbaaca5573a5ac31db429",
  "550aa4af4bdc2dd4348b456e",
  "566162e44bdc2d3f298b4573",
  "5448e8d64bdc2dce718b4568",
  "5448f3a14bdc2d27728b4569",
  "57864a66245977548f04a81f",
  "543be5f84bdc2dd4348b456a",
  "5a341c4686f77469e155819e",
  "550aa4bf4bdc2dd6348b456b",
  "55818b084bdc2d5b648b4571",
  "5448e8d04bdc2ddf718b4569",
  "543be6674bdc2df1348b4569",
  "55818af64bdc2d5b648b4570",
  "5d650c3e815116009f6201d2",
  "550aa4154bdc2dd8348b456b",
  "56ea9461d2720b67698b456f",
  "55802f3e4bdc2de7118b4584",
  "5447bedf4bdc2d87278b4568",
  "55818a104bdc2db9688b4569",
  "5645bcb74bdc2ded0b8b4578",
  "5a341c4086f77401f2541505",
  "57864c322459775490116fbf",
  "5448ecbe4bdc2d60728b4568",
  "55d720f24bdc2d88028b456d",
  "55818ac54bdc2d5b648b456e",
  "54009119af1c881c07000029",
  "57864a3d24597754843f8721",
  "543be5e94bdc2df1348b4568",
  "5c164d2286f774194c5e69fa",
  "5c99f98d86f7745c314214b3",
  "5447e1d04bdc2dff2f8b4567",
  "55818b014bdc2ddc698b456b",
  "55818b0e4bdc2dde698b456e",
  "5671435f4bdc2d96058b4569",
  "566965d44bdc2d814c8b4571",
  "57864e4c24597754843f8723",
  "5447bed64bdc2d97278b4568",
  "5448bc234bdc2d3c308b4569",
  "567849dd4bdc2d150f8b456e",
  "5447b6194bdc2d67278b4567",
  "55802f4a4bdc2ddb688b4569",
  "5448f3ac4bdc2dce718b4569",
  "57864c8c245977548867e7f1",
  "5448f39d4bdc2d0a728b4568",
  "543be5664bdc2dd4348b4569",
  "5448bf274bdc2dfc2f8b456a",
  "5448fe124bdc2da5018b4567",
  "543be5dd4bdc2deb348b4569",
  "55818b224bdc2dde698b456f",
  "5448fe394bdc2d0d028b456c",
  "550aa4dd4bdc2dc9348b4569",
  "5a2c3a9486f774688b05e574",
  "55818ae44bdc2dde698b456c",
  "590c745b86f7743cc433c5f2",
  "5447b5cf4bdc2d65278b4567",
  "55818a684bdc2ddd698b456d",
  "550ad14d4bdc2dd5348b456c",
  "557596e64bdc2dc2118b4571",
  "55818b1d4bdc2d5b648b4572",
  "55818a304bdc2db5418b457d",
  "566168634bdc2d144c8b456c",
  "55818a604bdc2db5418b457e",
  "5447b6094bdc2dc3278b4567",
  "5448fe7a4bdc2d6f028b456b",
  "550aa4cd4bdc2dd8348b456c",
  "5795f317245977243854e041",
  "5447b5e04bdc2d62278b4567",
  "5447b6254bdc2dc3278b4568",
  "55818aeb4bdc2ddc698b456a",
  "5447bee84bdc2dc3278b4569",
  "5447e0e74bdc2d3c308b4567",
  "5661632d4bdc2d903d8b456b",
  "566abbb64bdc2d144c8b457d",
  "567583764bdc2d98058b456e",
  "5448f3a64bdc2d60728b456a",
  "55818a594bdc2db9688b456a",
  "55818b164bdc2ddc698b456c",
  "5d21f59b6dbe99052b54ef83",
  "543be6564bdc2df4348b4568",
  "57864bb7245977548b3b66c2",
  "5448e5284bdc2dcb718b4567",
  "5448e5724bdc2ddf718b4568",
  "5422acb9af1c889c16000029",
];

/**
 * Trading Controller
 */
class TradingController {
    static Instance = new TradingController();
    static ItemDbList = [];
    static TraderIdToNameMap = {
      "Prapor": "54cb50c76803fa8b248b4571",
      "Therapist": "54cb57776803fa99248b456e",
      "Fence": "579dc571d53a0658a154fbec",
      "Skier": "58330581ace78e27b8b10cee",
      "Mechanic": "5a7c2eca46aef81a7ca2145d",
      "Ragman": "5ac3b934156ae10c4430e83c",
      "Jaeger": "5c0647fdd443bc2504c2d371",
      "Ragfair": "ragfair"
    };
    static FenceId = TradingController.TraderIdToNameMap["Fence"];
    static RagfairId = TradingController.TraderIdToNameMap["Ragfair"];
    /**
     * Last time that fence assort was generated
     */
    static LastFenceGenerationTime = undefined;
    /**
     * Keeping previously generated Assorts for examining etc.
     */
    static PreviousAssorts = [];
    
    static iterItemChildren(item, item_list) {
      // Iterates through children of `item` present in `item_list`
      return item_list.filter((child_item) => child_item.parentId === item._id);
    }
    
    static iterItemChildrenRecursively(item, item_list) {
      // Recursively iterates through children of `item` present in `item_list`
    
      let stack = TradingController.iterItemChildren(item, item_list);
      let child_items = [...stack];
    
      while (stack.length > 0) {
        let child = stack.pop();
        let children_of_child = TradingController.iterItemChildren(child, item_list);
        stack.push(...children_of_child);
        child_items.push(...children_of_child);
      }
    
      return child_items;
    }

    static generateItemIds(...items) {
      const ids_map = {};
    
      for (const item of items) {
        ids_map[item._id] = utility.generateNewItemId();
      }
    
      for (const item of items) {
        item._id = ids_map[item._id];
        if (item.parentId in ids_map) {
          item.parentId = ids_map[item.parentId];
        }
      }
    }

    /**
     * Dynamically generates a TraderAssort
     * @param {string} sessionID 
     * @returns {TraderAssort} Assort
     */
    static generateFenceAssort(sessionID) {

      if(TradingController.getTrader(TradingController.FenceId) !== undefined
        && global._database.traders[TradingController.FenceId].assort !== undefined
        && global._database.traders[TradingController.FenceId].assort.items.length > 0
        && TradingController.LastFenceGenerationTime !== undefined
        && TradingController.LastFenceGenerationTime > Date.now() - (60 * 1000)
        )
        return global._database.traders[TradingController.FenceId].assort;


        TradingController.LastFenceGenerationTime = Date.now();
        const fenceId = "579dc571d53a0658a154fbec";
        // const base = { items: [], barter_scheme: {}, loyal_level_items: {} };
        const base = new TraderAssort();
      
        const traderStanding = Math.max(-10, Math.min(10, TradingController.getTraderStanding(sessionID, TradingController.FenceId)));
        const traderStandingPriceChange = Math.max(1, 3 + (Math.min(1,Math.max(traderStanding, 0)) * -1) + (Math.random() * 0.5));
        // Clean out the Assort
        global._database.traders[fenceId].assort = base;
        // TradingController.setTraderAssort(fenceId, base);
        /**
         * {}
         */
        const fileAssort = JSON.parse(fs.readFileSync(process.cwd() + "/db/traders/579dc571d53a0658a154fbec/assort.json"));

        const dbItemKeys = Object.keys(global._database.items);
        //  for (let i = 0; i < 100; i++) {
          while(base.items.length < 50) {
            let random_item_index = utility.getRandomInt(
              0,
              // fileAssort.items.length - 1
              dbItemKeys.length - 1
            );

            // const random_item = JSON.parse(JSON.stringify(fileAssort.items[random_item_index]));
            const random_item = JSON.parse(JSON.stringify(global._database.items[dbItemKeys[random_item_index]]));
            const tpl = random_item._tpl !== undefined ? random_item._tpl : random_item._id;
            if(base.items.findIndex(x=>x._id === random_item._id) !== -1)
              continue;

            if(base.items.findIndex(x=>x._id === tpl) !== -1)
              continue;

            if(ItemParentsList.findIndex(x=>x === random_item._id) !== -1)
              continue;

            if(ItemParentsList.findIndex(x=>x === tpl) !== -1)
              continue;

            const templateItem = helper_f.tryGetItem(tpl);
            if(templateItem === undefined)
              continue;

            const isItemBuyable = templateItem._props.IsUnbuyable === false;

            const item_price = helper_f.getTemplatePrice(tpl);
            if(isItemBuyable === false
               || templateItem._props.QuestItem === true
               || item_price <= 1)
              continue;

            var itemRem = {};
            if(!LootController.FilterItemByRarity(templateItem, itemRem, Math.max(0.5, traderStanding)))
              continue;

            let newAssortItem = {
              // "_id": utility.generateNewItemId().toString(),
              "_id": tpl,
              "_tpl": tpl,
              "parentId": "hideout",
              "slotId": "hideout",
              "upd": {
                  "StackObjectsCount": 99999999,
                  "UnlimitedCount": true
              }
            };

            //if(random_item["upd"] !== undefined && random_item["upd"]["StackObjectsCount"] !== undefined) {
              newAssortItem["upd"].StackObjectsCount = 1;
              newAssortItem["upd"].UnlimitedCount = false
              if(templateItem._props.ammoType !== undefined) {
                newAssortItem["upd"].StackObjectsCount = Math.round(Math.random() * Math.max(30, 200 - templateItem._props.Damage));
              }
            //}

            newAssortItem.DebugName = templateItem._props.Name;
            if(newAssortItem.DebugName.includes("ammo_box")) {
              continue;
              // random_item["upd"]["StackMaxRandom"] = templateItem._props.StackMaxRandom;
              // random_item["upd"]["StackObjectsCount"] = templateItem._props.StackObjectsCount;
            }

            base.items.push(newAssortItem);

        }

        // ----------------------------------------------------------------------------------------------------------------
        // Add some random presets to the fence assortment.
        // Presets are gathered from the database globals file. global._database.globals.ItemPresets
        // They require the root and child items to make up the full set. You could just use parts, if you wish.

        // const presetItems = [];
        // var presetItemsRemovedByRarity = {};
        // for(const itemId in global._database.globals.ItemPresets) {
        //   const preset = global._database.globals.ItemPresets[itemId];
        //   const templateItem = helper_f.tryGetItem(preset._items[0]._tpl);
        //   // console.log(templateItem);

        //   let traderStandingRarityMulti = Math.min(6.0, Math.max(3.0, 3.0 + traderStanding));
        //   if(!LootController.FilterItemByRarity(templateItem, presetItemsRemovedByRarity, traderStandingRarityMulti))
        //     continue;

        //   if(base.items.findIndex(x=>x._id === preset._items[0]._id) !== -1)
        //     continue;

        //     // const newWeaponParentId = utility.generateNewItemId();
        //     let newBaseWeapon = {
        //       "_id": preset._items[0]._id,
        //       // "_id": templateItem._id,
        //       "_tpl": preset._items[0]._tpl,
        //       "parentId": "hideout",
        //       "slotId": "hideout",
        //       "upd": {
        //           "BuyRestrictionCurrent": 0,
        //           "BuyRestrictionMax": 1,
        //           "StackObjectsCount": 1,
        //           "UnlimitedCount": false
        //       }
        //     }
        //     base.items.push(newBaseWeapon);
        //     for(let childIndex = 1; childIndex < preset._items.length; childIndex++)
        //     { 
        //       const childItem = preset._items[childIndex];
        //       // const newWeaponChildId = utility.generateNewItemId();
        //       // childItem._id = newWeaponChildId;
        //       // childItem.parentId = newWeaponParentId;
        //       base.items.push(childItem);
        //     }
        // }
        // console.log(presetItemsRemovedByRarity);
        
        for(let i = 0; i < base.items.length; i++) {
        }

        for(let i = 0; i < base.items.length; i++){
          const random_item = base.items[i];
          let random_item_children = TradingController.iterItemChildrenRecursively(
            random_item,
            base.items
          );

          let item_price = helper_f.getTemplatePrice(random_item._tpl);
          for (const child_item of random_item_children) {
            item_price += helper_f.getTemplatePrice(child_item._tpl);
          }
          if(item_price <= 1)
            item_price = 1;

          base.barter_scheme[random_item._id] = [
                    [
                      {
                        count: Math.round(item_price * traderStandingPriceChange),
                        _tpl: "5449016a4bdc2d6f028b456f", // Rubles template
                      },
                    ],
                  ];
          base.loyal_level_items[random_item._id] = 1;
        }

        // Save change to the database
        global._database.traders[fenceId].assort = base;
        global._database.traders[fenceId].assort.items = [...new Set(base.items)];

        TradingController.PreviousAssorts.push(base);
        // TradingController.setTraderAssort(fenceId, base);
        return base;
      }

      /**
       * Gets the Trader Standing from the Profile
       * @param {*} playerId 
       * @param {*} traderId 
       */
      static getTraderStanding(playerId, traderId) {
        const profile = AccountController.getPmcProfile(playerId);
        return profile.TradersInfo[traderId].standing;
      }

      /**
       * Sets the Trader Standing to the Profile
       * @param {*} playerId 
       * @param {*} traderId 
       */
      static setTraderStanding(playerId, traderId, value) {
        const profile = AccountController.getPmcProfile(playerId);
        profile.TradersInfo[traderId].standing = mathjs.round(value, 3);
      }

      /**
 * Get player loyalty LEVEL for current trader...
 * when used to get the index of a trader loyaltyLevels, must use -1
 * @param {Object} pmcData -> player infos,
 * @param {string} traderID -> current trader ID,
 * @returns {number} calculatedLoyalty -> loyalty level
 */
static getLoyalty(pmcData, traderID) {
  let playerSaleSum;
  let playerStanding;
  let playerLevel;

  if (pmcData.TradersInfo[traderID]) {
    // we fetch player's trader related data
    playerSaleSum = pmcData.TradersInfo[traderID].salesSum;
    playerStanding = pmcData.TradersInfo[traderID].standing;
    playerLevel = pmcData.Info.Level;
  } else {
    // default traders value
    playerSaleSum = 0;
    playerStanding = 0;
    playerLevel = pmcData.Info.Level;

    pmcData.TradersInfo[traderID] = { salesSum: 0, standing: 0 };
  }
  // we fetch the trader data
  const traderInfo = global._database.traders[traderID].base;

  let calculatedLoyalty = 0;
  if (traderID !== "ragfair") {
    // we check if player meet loyalty requirements
    for (let loyaltyLevel of traderInfo.loyaltyLevels) {
      if (playerSaleSum >= loyaltyLevel.minSalesSum &&
        playerStanding >= loyaltyLevel.minStanding &&
        playerLevel >= loyaltyLevel.minLevel) {
        calculatedLoyalty++;
      }
      else {
        if (calculatedLoyalty == 0) { calculatedLoyalty = 1; }
        break;
      }
    }
  } 
  else { 
    // return "ragfair" 
    return playerLevel;
  }

  return calculatedLoyalty;
}

      /**
       * 
       * @param {string} traderId 
       * @param {TraderAssort} assort 
       */
      static setTraderAssort(traderId, assort) {
        DatabaseController.getDatabase().traders[traderId] = assort;
      }

      /**
       * 
       * @param {*} traderId 
       * @returns 
       */
      static getTrader(traderId) {
        return DatabaseController.getDatabase().traders[traderId];
      }

      /**
       * Gets the complete Trader Assort (NOT filtered by Levels)
       * @param {*} traderId 
       * @returns {object} Assort
       */
      static getTraderAssort(traderId, sessionID) {

        if(sessionID !== undefined) {
          TradingController.generateFenceAssort(sessionID);
        }


        if(traderId !== 'ragfair')
          // return DatabaseController.getDatabase().traders[traderId].assort;
          return global._database.traders[traderId].assort;
        else 
          return new TraderAssort();
      }

      /**
       * Gets the complete Trader Assort (NOT filtered by Levels)
       * @param {*} traderId 
       * @returns {object} Assort
       */
       static getTraderAssortFilteredByLevel(traderId, sessionID) {
        const newAssort = new TraderAssort();

        if(sessionID === undefined || sessionID === "") {
          return newAssort;
        }

        const assort = TradingController.getTraderAssort(traderId, sessionID);
        const pmcData = AccountController.getPmcProfile(sessionID);
        const traderLevel = TradingController.getLoyalty(pmcData, traderId);
        if (traderLevel !== "ragfair" 
          && traderId !== "ragfair"
          && global._database.traders[traderId].questassort !== undefined) {
          let traderQuestAssort = global._database.traders[traderId].questassort;

          // Get all items filtered by level
          for (const key in assort.loyal_level_items) {
            const requiredLevel = assort.loyal_level_items[key];
            if(requiredLevel <= traderLevel) {
              const itemIndex = assort.items.findIndex(x=>x._id === key);
              if(itemIndex !== -1) {
                const questStatus = quest_f.getQuestStatus(pmcData, traderQuestAssort.started[key]);

                if (
                  key in traderQuestAssort.started && questStatus !== "Started"
                ) {
                  continue;
                }
        
                if (
                  key in traderQuestAssort.success &&
                  quest_f.getQuestStatus(pmcData, traderQuestAssort.success[key]) !==
                  "Success"
                ) {
                  continue;
                }
        
                if (
                  key in traderQuestAssort.fail &&
                  quest_f.getQuestStatus(pmcData, traderQuestAssort.fail[key]) !== "Fail"
                ) {
                  continue;
                }

                newAssort.barter_scheme[key] = assort.barter_scheme[key];
                newAssort.loyal_level_items[key] = requiredLevel;

                const assortItem = assort.items[itemIndex];
                newAssort.items.push(assortItem);
              }
            }
          }
        }

        // 
        const childItemsToAdd = [];
        for (const assortItem of newAssort.items) {
          const childItems = TradingController.iterItemChildrenRecursively(assortItem, 
            assort.items);
          for(const childItem of childItems) {
            childItemsToAdd.push(childItem);
          }
        }
        for (const assortItem of childItemsToAdd) {
          newAssort.items.push(assortItem);
        }
        return newAssort;
      }

      /**
       * Gets all the data for each trader in the memory database
       * @returns {*} All traders currently in memory database
       */
      static getAllTraders() {
        const keys = Object.keys(DatabaseController.getDatabase().traders);
        const traders = [];
        for(const key of keys) {
          traders.push(DatabaseController.getDatabase().traders[key]);
        }
        return traders;
      }

      /**
       * NOT COMPLETE
       * Add a trader to the in Memory Database
       * @param {string} traderId 
       * @param {string} traderName 
       * @param {TraderAssort} traderAssort 
       * @param {object} traderInfo 
       */
      static addTrader(traderId, traderName, traderAssort, traderInfo) {

      }

      /**
       * NOT COMPLETE
       * Redirects to addTrader
       * @param {string} traderId 
       * @param {string} traderName 
       * @param {TraderAssort} traderAssort 
       * @param {object} traderInfo 
       */
      static createTrader(traderId, traderName, traderAssort, traderInfo) {
        TradingController.addTrader(traderId, traderName, traderAssort, traderInfo);
      }

      /**
       * NOT COMPLETE
       * @param {string} traderId 
       */
      static saveTraderToDisk(traderId) {
        const trader = TradingController.getTrader(traderId);
        
      }

      static getRagfairMarketPrice(data) {

        const ragfairMultiplier = ConfigController.Configs["gameplay"].trading.fleaMarket.ragfairMultiplier;
        const min = ItemController.getTemplatePrice(data.templateId);
        const max = ItemController.getTemplatePrice(data.templateId) * ragfairMultiplier;
        const avg = ((min + max) / 2);
        return { min: min, max: max, avg: avg };
      }

      static getFleaMarketOfferBase() {

        const offerBase = utility.DeepCopy(DatabaseController.getDatabase().core.fleaOffer);
        return offerBase;
      }

      static addFleaMarketOffer(pmcData, body, sessionID) {

        // console.log(body);

        const offerBase = TradingController.getFleaMarketOfferBase();

        let offer = utility.DeepCopy(offerBase);

        offer.intId = utility.getRandomInt(0, 214712343);
        offer._id = utility.generateNewId();
        const offerItemBase = utility.DeepCopy(offer.items[0]);
        offer.items = [];
        // offer.items[0]._tpl = template;
        //   offer.items[0].upd.StackObjectsCount = 1;
        offer.root = utility.generateNewId();
        for(const it of body.items) {
          const offerItem = utility.DeepCopy(offerItemBase);
          offerItem._id = utility.generateNewId();
          const matchingItemsInInventory = pmcData.Inventory.items.filter(x => x._id === it);
          if(matchingItemsInInventory) {
            const itemInInventory = matchingItemsInInventory[0];
            offerItem._tpl = itemInInventory._tpl;
            offerItem.upd.StackObjectsCount = 1;
            offerItem.parentId = 'hideout';
            offerItem.slotId = 'hideout';
            offer.items.push(offerItem);
            move_f.removeItemFromProfile(pmcData, it, sessionID);
          }
        }
        offer.items[0]._id = offer.root;
        offer.item = offer.items[0];

        offer.requirements = body.requirements;
        offer.itemsCost = body.requirements[0].count;
        offer.requirementsCost = body.requirements[0].count;
        offer.summaryCost = body.requirements[0].count;
        offer.user.id = pmcData.aid;
        offer.user.nickname = pmcData.Info.Nickname;

        // logger.logWarning("Adding a Flea Market offer is not yet supported by SIT");
        pmcData.RagfairInfo.offers.push(offer);


        // console.log("addFleaMarketOffer");
        // const ragfairAssort = TradingController.getTraderAssort("ragfair", sessionID);
        // if(global.webSocketClientBySessionId[sessionID]) {
        //   global.webSocketClientBySessionId[sessionID].send(
        //     JSON.stringify({ type: "RagfairOfferSold"
        //     , offerId: utility.generateNewId()
        //     , count: 1
        //     , handbookId: body.items[0]}));
        // }

        return item_f.handler.getOutput(sessionID);
      }

      static handledOffers = [];

      static checkAIBuyItemsOnFleaMarket() {

        let offers = [];
        for(const acc of AccountController.getAllAccounts()) {
          const profile = AccountController.getPmcProfile(acc._id);
          if(profile && profile.RagfairInfo && profile.RagfairInfo.offers)
            offers = [...offers, ...profile.RagfairInfo.offers];
        }

        const soldOffers = [];

        if(offers.length > 0) {
          // console.log(offers);
          for(const offer of offers) {

            if(TradingController.handledOffers.includes(offer._id))
              continue;

            TradingController.handledOffers.push(offer._id);

            let offerRank = 0;
            const ragfairMultiplier = ConfigController.Configs["gameplay"].trading.fleaMarket.ragfairMultiplier;

            const currentFleaMarketPrices = TradingController.getRagfairMarketPrice({ templateId: offer.items[0]._tpl });
            const currentTradingPrice = ItemController.getTemplatePrice(offer.items[0]._tpl);
            const currentRagfairPrice = currentFleaMarketPrices.avg;
            offerRank = Math.min(100, Math.max(0, ((currentRagfairPrice / offer.summaryCost) * 100)));
            const randomNumber = utility.getRandomInt(50, 100);
            if(offerRank >= randomNumber) {
              // console.log("buy it!");
              if(global.webSocketClientBySessionId[offer.user.id]) {
                global.webSocketClientBySessionId[offer.user.id].send(
                  JSON.stringify({ type: "RagfairOfferSold"
                  , offerId: offer._id
                  , count: 1
                  , handbookId: offer.items[0]._tpl}));
              }

              const rewards = [];
              for(const req of offer.requirements) {
                rewards.push({
                  _id: utility.generateNewId(),
                  _tpl: req._tpl,
                  upd: {
                    StackObjectsCount: req.count,
                    SpawnedInSession: true
                  }
                });
              }

              const dbItems = ItemController.getDatabaseItems();
              const itemSold = dbItems[offer.items[0]._tpl];
              const itemName = DatabaseController.getDatabase().locales.global.en.templates[offer.items[0]._tpl].Name;

              soldOffers.push(offer._id);

              let messageContent = {
                templateId: "",
                type: dialogue_f.getMessageTypeValue("fleamarketMessage"),
                maxStorageTime: global._database.gameplay.other.RedeemTime * 3600,
                text: `Hello! Your ${itemName} (x${offer.items.length}) has been sold on the Flea Market!`
              }

              DialogueController.AddDialogueMessage(
                TradingController.TraderIdToNameMap['Ragman'],
                messageContent,
                offer.user.id,
                rewards
                );

              // if(global.webSocketClientBySessionId[offer.user.id]) {
              //   global.webSocketClientBySessionId[offer.user.id].send(
              //     JSON.stringify({ type: "new_message" }));
              // }
            }
          }
        }

        for(const acc of AccountController.getAllAccounts()) {
          const profile = AccountController.getPmcProfile(acc._id);
          if(profile && profile.RagfairInfo && profile.RagfairInfo.offers)
            profile.RagfairInfo.offers = profile.RagfairInfo.offers.filter(x => !soldOffers.includes(x._id));
        }
      }


      static getFleaMarketOffersFromPlayers(sessionID, request) {
        let jsonToReturn = { categories: {}, offers: [] }
      
        for(const acc of AccountController.getAllAccounts()) {
      
          const profile = AccountController.getPmcProfile(acc._id);
          jsonToReturn.offers = [...jsonToReturn.offers, ...profile.RagfairInfo.offers];
        }
      
        let offersFilters = []; //this is an array of item tpl who filter only items to show
      
        if (request.buildCount) {
          // Case: weapon builds
          offersFilters = Object.keys(request.buildItems);
          jsonToReturn = fillCategories(jsonToReturn, offersFilters);
        } else {
          // Case: search
          if (request.linkedSearchId) {
            //offersFilters.concat( getLinkedSearchList(request.linkedSearchId) );
            offersFilters = [...offersFilters, ...getLinkedSearchList(request.linkedSearchId)];
            jsonToReturn = fillCategories(jsonToReturn, offersFilters);
          } else if (request.neededSearchId) {
            offersFilters = [...offersFilters, ...getNeededSearchList(request.neededSearchId)];
            jsonToReturn = fillCategories(jsonToReturn, offersFilters);
          }
      
          if (request.removeBartering == true) {
            jsonToReturn = removeBarterOffers(jsonToReturn);
            jsonToReturn = fillCategories(jsonToReturn, offersFilters);
          }
      
          // Case: category
          if (request.handbookId) {
            let handbookList = getCategoryList(request.handbookId);
      
            if (offersFilters.length) {
              offersFilters = helper_f.arrayIntersect(offersFilters, handbookList);
            } else {
              offersFilters = handbookList;
            }
          }
        }
      
        let offersToKeep = jsonToReturn.offers;
        // for (let offer in jsonToReturn.offers) {
        //   for (let tplTokeep of offersFilters) {
        //     if (jsonToReturn.offers[offer].items[0]._tpl == tplTokeep) {
        //       offersToKeep.push(jsonToReturn.offers[offer]);
        //       break;
        //       // check if offer is really available, removes any quest locked items not in current assort of a trader
        //       // const tmpOffer = jsonToReturn.offers[offer];
        //       // const traderId = tmpOffer.user.id;
        //       // const traderAssort = TradingController.getTraderAssort(traderId, sessionID).items;
        //       // for (let item of traderAssort) {
        //       //   if (item._id === tmpOffer.root) {
        //       //     jsonToReturn.offers[offer].items[0].upd.StackObjectsCount = 30; //(tmpOffer.items[0].upd.BuyRestrictionMax - tmpOffer.items[0].upd.BuyRestrictionCurrent);
        //       //     offersToKeep.push(jsonToReturn.offers[offer]);
        //       //     break;
        //       //   }
        //       // }
        //     }
        //   }
        // }
        jsonToReturn.offers = offersToKeep;
        jsonToReturn.offers = sortOffers(request, jsonToReturn.offers);
      
        return jsonToReturn;
      }
}

class TraderAssort {
  constructor() {
    this.items = [];
    this.barter_scheme = {};
    this.loyal_level_items = {};
  }
}

module.exports.TradingController = TradingController;