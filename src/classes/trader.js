"use strict";

const { AccountController } = require("../Controllers/AccountController");
const { CustomizationController } = require("../Controllers/CustomizationController");
const { TradingController } = require("../Controllers/TradingController");

/* TraderServer class maintains list of traders for each sessionID in memory. */
class TraderServer {
  constructor() {
    this.fence_generated_at = 0;
  }
  getTrader(traderID) {
    return global._database.traders[traderID].base;
  }
  saveTrader(traderId) {
    let inputNodes = utility.DeepCopy(global._database.traders[traderId].assort);

    let base = { items: [], barter_scheme: {}, loyal_level_items: {}};
    for (let item in inputNodes) {
      if (typeof inputNodes[item].items[0] != "undefined") {
        let ItemsList = inputNodes[item].items;
        ItemsList[0]["upd"] = {};
        if (inputNodes[item].default.unlimited)
          ItemsList[0].upd["UnlimitedCount"] = true;
        ItemsList[0].upd["StackObjectsCount"] = inputNodes[item].default.stack;
      }
      for (let assort_item in inputNodes[item].items) {
        base.items.push(inputNodes[item].items[assort_item]);
      }
      base.barter_scheme[item] = inputNodes[item].barter_scheme;
      base.loyal_level_items[item] = inputNodes[item].loyalty;
    }
    global._database.traders[traderId].assort = base;
  }

  setTraderBase(base) {
    global._database.traders[base._id].base = base;
    if (typeof db.traders[base._id] != "undefined")
      fileIO.write(db.traders[base._id].base, base, true, false);
  }

  getAllTraders() {
    //if (!keepalive) keepalive_f.updateTraders(sessionID);
    let Traders = [];
    for (const traderID in global._database.traders) {
      if (traderID === "ragfair") {
        continue;
      }
      Traders.push(global._database.traders[traderID].base);
    }
    return Traders;
  }

  getAssort(sessionID, traderID, isBuyingFromFence = false) {
    if (traderID === "579dc571d53a0658a154fbec" && !isBuyingFromFence) {
      // Fence
      // Lifetime in seconds
      const fence_assort_lifetime = global._database.gameplay.trading.traderSupply[traderID];

      // Current time in seconds
      const current_time = Math.floor(new Date().getTime() / 1000);

      // Initial Fence generation pass.
      if (this.fence_generated_at === 0 
        || !this.fence_generated_at
        || this.fence_generated_at + 30 < current_time
        ) {
        this.fence_generated_at = current_time;
        TraderUtils.generateFenceAssort(sessionID);
      }

    }

    let baseAssorts = global._database.traders[traderID].assort;

    // Build what we're going to return.
    let assorts = utility.DeepCopy(baseAssorts);

    // Fetch the current trader loyalty level
    const pmcData = AccountController.getPmcProfile(sessionID);
    const TraderLevel = TradingController.getLoyalty(pmcData, traderID);

    if (TraderLevel !== "ragfair" && traderID !== "ragfair") {
      // 1 is min level, 4 is max level
      let questassort = global._database.traders[traderID].questassort;

      for (let key in baseAssorts.loyal_level_items) {
        let requiredLevel = baseAssorts.loyal_level_items[key];
        if (requiredLevel > TraderLevel) {
          assorts = TraderUtils.removeItemFromAssort(assorts, key);
          continue;
        }

        if (
          key in questassort.started &&
          quest_f.getQuestStatus(pmcData, questassort.started[key]) !==
          "Started"
        ) {
          assorts = TraderUtils.removeItemFromAssort(assorts, key);
          continue;
        }

        if (
          key in questassort.success &&
          quest_f.getQuestStatus(pmcData, questassort.success[key]) !==
          "Success"
        ) {
          assorts = TraderUtils.removeItemFromAssort(assorts, key);
          continue;
        }

        if (
          key in questassort.fail &&
          quest_f.getQuestStatus(pmcData, questassort.fail[key]) !== "Fail"
        ) {
          assorts = TraderUtils.removeItemFromAssort(assorts, key);
        }
      }
    }
    return assorts;
  }

  getAllCustomization(sessionID) {
    let output = [];
    for (let traderID in global._database.traders) {
      ///if customization_seller
      if(global._database.traders[traderID].base.customization_seller == true){
        output = output.concat(CustomizationController.getCustomization(traderID, sessionID));
      }
    }
    return output;
  }
  getPurchasesData(traderID, sessionID) {
    const pmcData = AccountController.getPmcProfile(sessionID);
    const trader = TradingController.getTrader(traderID).base;
    const currency = helper_f.getCurrency(trader.currency);
    let output = {};

    // get sellable items
    for (let item of pmcData.Inventory.items) {
      let price = 0;

      if (
        item._id === pmcData.Inventory.equipment ||
        item._id === pmcData.Inventory.stash ||
        item._id === pmcData.Inventory.questRaidItems ||
        item._id === pmcData.Inventory.questStashItems ||
        helper_f.isNotSellable(item._tpl) ||
        (trader.sell_category.length > 0 &&
          TraderUtils.traderFilter(trader.sell_category, item._tpl) === false)
      ) {
        continue;
      }

      // find all child of the item (including itself) and sum the price
      for (let childItem of helper_f.findAndReturnChildrenAsItems(
        pmcData.Inventory.items,
        item._id
      )) {
        if (!global._database.items[childItem._tpl]) {
          continue;
        } 
        const getPrice = helper_f.getTemplatePrice(childItem._tpl);
        let priceCoef = (trader.loyaltyLevels[TradingController.getLoyalty(pmcData, traderID) - 1].buy_price_coef) / 100;
        let tempPrice = getPrice >= 1 ? getPrice : 1;
        let count =
          "upd" in childItem && "StackObjectsCount" in childItem.upd
            ? childItem.upd.StackObjectsCount
            : 1;
        price = price + ((tempPrice - (tempPrice * priceCoef)) * count); // I know parentheses aren't needed but I find it more readable -cq
      }

      // dogtag calculation
      if (
        "upd" in item &&
        "Dogtag" in item.upd &&
        helper_f.isDogtag(item._tpl)
      ) {
        price *= item.upd.Dogtag.Level;
      }

      // meds calculation
      let hpresource =
        "upd" in item && "MedKit" in item.upd ? item.upd.MedKit.HpResource : 0;

      if (hpresource > 0) {
        let maxHp = helper_f.tryGetItem(item._tpl)._props.MaxHpResource;
        price *= hpresource / maxHp;
      }

      // weapons and armor calculation
      let repairable =
        "upd" in item && "Repairable" in item.upd ? item.upd.Repairable : 1;

      if (repairable !== 1) {
        price *= repairable.Durability / repairable.MaxDurability;
      }

      // get real price
      if (trader.discount > 0) {
        price -= (trader.discount / 100) * price;
      }
      price = helper_f.fromRUB(price, currency);
      price = price > 0 && price !== "NaN" ? price : 1;
      output[item._id] = [[{ _tpl: currency, count: price.toFixed(0) }]];
    }

    return output;
  }
}

class TraderUtils {

  static iterItemChildren(item, item_list) {
    // Iterates through children of `item` present in `item_list`
    return item_list.filter((child_item) => child_item.parentId === item._id);
  }

  static iterItemChildrenRecursively(item, item_list) {
    // Recursively iterates through children of `item` present in `item_list`
  
    let stack = TraderUtils.iterItemChildren(item, item_list);
    let child_items = [...stack];
  
    while (stack.length > 0) {
      let child = stack.pop();
      let children_of_child = TraderUtils.iterItemChildren(child, item_list);
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

  static generateFenceAssort(sessionID) {

    TradingController.generateFenceAssort(sessionID);
    // const fenceId = "579dc571d53a0658a154fbec";
    // let base = { items: [], barter_scheme: {}, loyal_level_items: {} };
  
    // let fence_base_assort = _database.traders[fenceId].base_assort.items;
    // //fileIO.readParsed(db.user.cache.assort_579dc571d53a0658a154fbec).data.items;
  
    // let fence_base_assort_root_items = fence_base_assort.filter((item) => item.parentId === "hideout");
  
    // const fence_assort = [];
    // const barter_scheme = {};
  
    // const FENCE_ASSORT_SIZE = global._database.gameplay.trading.fenceAssortSize;
    // for (let i = 0; i < FENCE_ASSORT_SIZE; i++) {
    //   let random_item_index = utility.getRandomInt(
    //     0,
    //     fence_base_assort_root_items.length - 1
    //   );
    //   let random_item = fence_base_assort_root_items[random_item_index];
    //   let random_item_children = TraderUtils.iterItemChildrenRecursively(
    //     random_item,
    //     fence_base_assort
    //   );
  
    //   TraderUtils.generateItemIds(random_item, ...random_item_children);
    //   if (fence_assort.some((el) => el._id === random_item._id)) {
    //     continue;
    //   } // Prevent duplicate item IDs.
    //   fence_assort.push(random_item, ...random_item_children);
  
    //   let item_price = helper_f.getTemplatePrice(random_item._tpl);
    //   for (const child_item of random_item_children) {
    //     item_price += helper_f.getTemplatePrice(child_item._tpl);
    //   }
  
    //   barter_scheme[random_item._id] = [
    //     [
    //       {
    //         count: Math.round(item_price),
    //         _tpl: "5449016a4bdc2d6f028b456f", // Rubles template
    //       },
    //     ],
    //   ];
    // }
  
    // base.items = fence_assort;
    // base.barter_scheme = barter_scheme;
    // global._database.traders[fenceId].assort = base;
  }

  static removeItemFromAssort(assort, itemID) {
    let ids_toremove = helper_f.findAndReturnChildrenByItems(
      assort.items,
      itemID
    );
  
    delete assort.barter_scheme[itemID];
    delete assort.loyal_level_items[itemID];
  
    for (let i in ids_toremove) {
      for (let a in assort.items) {
        if (assort.items[a]._id === ids_toremove[i]) {
          assort.items.splice(a, 1);
        }
      }
    }
  
    return assort;
  }

  static traderFilter(traderFilters, tplToCheck) {
    for (let filter of traderFilters) {
      for (let iaaaaa of helper_f.templatesWithParent(filter)) {
        if (iaaaaa == tplToCheck) {
          return true;
        }
      }
  
      for (let subcateg of helper_f.childrenCategories(filter)) {
        for (let itemFromSubcateg of helper_f.templatesWithParent(subcateg)) {
          if (itemFromSubcateg === tplToCheck) {
            return true;
          }
        }
      }
    }
  
    return false;
  }
}

module.exports.handler = new TraderServer();
