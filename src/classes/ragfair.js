"use strict";

const { AccountController } = require('../Controllers/AccountController');
const { ConfigController } = require('../Controllers/ConfigController');
const { DatabaseController } = require('../Controllers/DatabaseController');
const { ItemController } = require('../Controllers/ItemController');
const { TradingController } = require('../Controllers/TradingController');

function sortOffersByID(a, b) {
  return a.intId - b.intId;
}

function sortOffersByRating(a, b) {
  return a.user.rating - b.user.rating;
}

function sortOffersByName(a, b) {
  // @TODO: Get localized item names
  try {
    let aa = helper_f.tryGetItem(a._id)[1]._name;
    let bb = helper_f.tryGetItem(b._id)[1]._name;

    aa = aa.substring(aa.indexOf("_") + 1);
    bb = bb.substring(bb.indexOf("_") + 1);

    return aa.localeCompare(bb);
  } catch (e) {
    return 0;
  }
}

function sortOffersByPrice(a, b) {
  return a.requirements[0].count - b.requirements[0].count;
}

/* function sortOffersByPriceSummaryCost(a, b) {
  return a.summaryCost - b.summaryCost;
} */

function sortOffersByExpiry(a, b) {
  return a.endTime - b.endTime;
}

function sortOffers(request, offers) {
  // Sort results
  switch (request.sortType) {
    case 0: // ID
      offers.sort(sortOffersByID);
      break;

    case 3: // Merchant (rating)
      offers.sort(sortOffersByRating);
      break;

    case 4: // Offer (title)
      offers.sort(sortOffersByName);
      break;

    case 5: // Price
      /*       if (request.offerOwnerType == 1) {
              offers.sort(sortOffersByPriceSummaryCost);
            } else {
              offers.sort(sortOffersByPrice);
            } */

      offers.sort(sortOffersByPrice);
      break;

    case 6: // Expires in
      offers.sort(sortOffersByExpiry);
      break;
  }

  // 0=ASC 1=DESC
  if (request.sortDirection === 1) {
    offers.reverse();
  }

  return offers;
}

/* Scans a given slot type for filters and returns them as a Set */
function getFilters(item, slot) {
  let result = new Set();
  if (slot in item._props && item._props[slot].length) {
    for (let sub of item._props[slot]) {
      if ("_props" in sub && "filters" in sub._props) {
        for (let filter of sub._props.filters) {
          for (let f of filter.Filter) {
            result.add(f);
          }
        }
      }
    }
  }

  return result;
}

/* Like getFilters but breaks early and return true if id is found in filters */
function isInFilter(id, item, slot) {
  if (slot in item._props && item._props[slot].length) {
    for (let sub of item._props[slot]) {
      if ("_props" in sub && "filters" in sub._props) {
        for (let filter of sub._props.filters) {
          if (filter.Filter.includes(id)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/* Because of presets, categories are not always 1 */
function countCategories(response) {
  let categ = {};

  for (let offer of response.offers) {
    let item = offer.items[0]; // only the first item can have presets

    categ[item._tpl] = categ[item._tpl] || 0;
    categ[item._tpl]++;
  }
  // not in search mode, add back non-weapon items
  for (let c in response.categories) {
    if (!categ[c]) {
      categ[c] = 1;
    }
  }

  response.categories = categ;
}

function getOffers(sessionID, request) {

  const BSGConfig_FleaMarketEnabled = _database.globals.config.RagFair.enabled;
  const BSGConfig_MinLevel = _database.globals.config.RagFair.minUserLevel;
  const SITConfig_UseFleaMarketLevelLock = ConfigController.Configs["gameplay"].trading.fleaMarket.UseFleaMarketLevelLock;
  const pmcProfile = AccountController.getPmcProfile(sessionID);
  const pmcLevel = AccountController.getPmcProfile(sessionID).Info.Level;


  // console.log(request);
  // require('fs').writeFileSync("ragfairRequest.json", JSON.stringify(request));
  let response = { categories: {}, offers: [], offersCount: 10, selectedCategory: "5b5f78dc86f77409407a7f8e" };
  let itemsToAdd = [];
  let offers = [];

  const offersFromTraders = getOffersFromTraders(sessionID, request);
  if (request.offerOwnerType === 1) {
    return offersFromTraders;
  }

  if (!request.linkedSearchId && !request.neededSearchId) {
    response.categories = trader_f.handler.getAssort(sessionID, "ragfair").loyal_level_items;
    // response.categories = TradingController.getTraderAssort("ragfair", sessionID).loyal_level_items;
  }

  if (request.buildCount) {
    // Case: weapon builds
    itemsToAdd = itemsToAdd.concat(Object.keys(request.buildItems));
  } else {
    // Case: search
    if (request.linkedSearchId) {
      itemsToAdd = getLinkedSearchList(request.linkedSearchId);
    } else if (request.neededSearchId) {
      itemsToAdd = getNeededSearchList(request.neededSearchId);
    }

    // Case: category
    if (request.handbookId) {
      let handbook = getCategoryList(request.handbookId);

      if (itemsToAdd.length) {
        itemsToAdd = helper_f.arrayIntersect(itemsToAdd, handbook);
      } else {
        itemsToAdd = handbook;
      }
    }
  }

 
  if(
    // Flea Market lock on
    (SITConfig_UseFleaMarketLevelLock === true
    && pmcLevel > BSGConfig_MinLevel)
    // Flea Market lock off
    || SITConfig_UseFleaMarketLevelLock === false
  )
    {
    for (let item of itemsToAdd) {
      offers = offers.concat(createOffer(item, request.onlyFunctional, request.buildCount === 0));
    }
  }

  // merge trader offers with player offers display offers is set to 'ALL'
  if (request.offerOwnerType === 0) {
    const traderOffers = getOffersFromTraders(sessionID, request).offers;

    offers = [...offers, ...traderOffers];

    const playerOffers = getFleaMarketOffersFromPlayers(sessionID, request).offers;
    // console.log(playerOffers);
    // console.log(offers);
    offers = [...offers, ...playerOffers];
    // console.log(offers);

  }




  response.offers = sortOffers(request, offers);
  countCategories(response);

  response.offersCount = response.offers.length;
  response.offers = response.offers.slice(request.page * request.limit, (request.page+1) * request.limit);
  return response;
}

function getOffersFromTraders(sessionID, request) {
  //let jsonToReturn = fileIO.readParsed(db.user.cache.ragfair_offers)
  let jsonToReturn = utility.DeepCopy(DatabaseController.getDatabase().ragfair_offers);
  let offersFilters = []; //this is an array of item tpl who filter only items to show

  jsonToReturn.categories = {};
  for (let offerC of jsonToReturn.offers) {
    jsonToReturn.categories[offerC.items[0]._tpl] = 1;
  }

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

  let offersToKeep = [];
  for (let offer in jsonToReturn.offers) {
    for (let tplTokeep of offersFilters) {
      if (jsonToReturn.offers[offer].items[0]._tpl == tplTokeep) {
        jsonToReturn.offers[offer].summaryCost = calculateCost(jsonToReturn.offers[offer].requirements);
        // check if offer is really available, removes any quest locked items not in current assort of a trader
        const tmpOffer = jsonToReturn.offers[offer];
        const traderId = tmpOffer.user.id;
        const traderAssort = TradingController.getTraderAssort(traderId, sessionID).items;
        for (let item of traderAssort) {
          if (item._id === tmpOffer.root) {
            jsonToReturn.offers[offer].items[0].upd.StackObjectsCount = 30; //(tmpOffer.items[0].upd.BuyRestrictionMax - tmpOffer.items[0].upd.BuyRestrictionCurrent);
            offersToKeep.push(jsonToReturn.offers[offer]);
            break;
          }
        }
      }
    }
  }
  jsonToReturn.offers = offersToKeep;
  jsonToReturn.offers = sortOffers(request, jsonToReturn.offers);

  return jsonToReturn;
}



function fillCategories(response, filters) {
  response.categories = {};
  for (let filter of filters) {
    response.categories[filter] = 1;
  }

  return response;
}

function removeBarterOffers(response) {
  let override = [];
  for (let offer of response.offers) {
    if (helper_f.isMoneyTpl(offer.requirements[0]._tpl) == true) {
      override.push(offer);
    }
  }
  response.offers = override;
  return response;
}

function calculateCost(barter_scheme) {
  //theorical , not tested not implemented
  let summaryCost = 0;

  for (let barter of barter_scheme) {
    summaryCost += helper_f.getTemplatePrice(barter._tpl) * barter.count;
  }
  //Math.round
  return ~~(summaryCost);
}

function getLinkedSearchList(linkedSearchId) {
  let item = global._database.items[linkedSearchId];
  // merging all possible filters without duplicates
  let result = new Set([...getFilters(item, "Slots"), ...getFilters(item, "Chambers"), ...getFilters(item, "Cartridges")]);

  return Array.from(result);
}

function getNeededSearchList(neededSearchId) {
  let result = [];

  for (let item of Object.values(global._database.items)) {
    if (isInFilter(neededSearchId, item, "Slots") || isInFilter(neededSearchId, item, "Chambers") || isInFilter(neededSearchId, item, "Cartridges")) {
      result.push(item._id);
    }
  }

  return result;
}

function getCategoryList(handbookId) {
  let result = [];

  // if its "mods" great-parent category, do double recursive loop
  if (handbookId === "5b5f71a686f77447ed5636ab") {
    for (let categ2 of helper_f.childrenCategories(handbookId)) {
      for (let categ3 of helper_f.childrenCategories(categ2)) {
        result = result.concat(helper_f.templatesWithParent(categ3));
      }
    }
  } else {
    if (helper_f.isCategory(handbookId)) {
      // list all item of the category
      result = result.concat(helper_f.templatesWithParent(handbookId));

      for (let categ of helper_f.childrenCategories(handbookId)) {
        result = result.concat(helper_f.templatesWithParent(categ));
      }
    } else {
      // its a specific item searched then
      result.push(handbookId);
    }
  }

  return result;
}

/** Create a list of offers
 * @param {*} template - ItemID
 * @param {*} onlyFunc - filter function
 * @param {*} usePresets - use presets
 * @returns {object}
 */
function createOffer(template, onlyFunc, usePresets = true) {
  if (!(template in global._database.items)) {
    logger.logWarning(`Item ${template} does not exist`);
    return [];
  }

  const useFleaMarketTradingBlacklist = ConfigController.Configs["gameplay"].trading.fleaMarket.UseFleaMarketTradingBlacklist;
 
  
  const item = ItemController.tryGetItem(template);
  if(item !== undefined) {
    if(useFleaMarketTradingBlacklist === true
        && item._props.CanSellOnRagfair === false
        )
      return [];
    if(item._props.IsUnbuyable === true)
      return [];
    if(useFleaMarketTradingBlacklist 
      && item._props.QuestItem === true)
      return [];
  }

  const offerBase = utility.DeepCopy(_database.core.fleaOffer);
  const offers = [];

  const ragfairMultiplier = ConfigController.Configs["gameplay"].trading.fleaMarket.ragfairMultiplier;
  const minItemsInOffer = Math.max(1, ConfigController.Configs["gameplay"].trading.fleaMarket.minItemsInOffer);
  const maxItemsInOffer = Math.max(minItemsInOffer, Math.min(99, ConfigController.Configs["gameplay"].trading.fleaMarket.maxItemsInOffer));

  // Preset
  if (usePresets && preset_f.handler.hasPreset(template)) {
    let presets = utility.DeepCopy(preset_f.handler.getPresets(template));

    for (let p of presets) {
      let offer = utility.DeepCopy(offerBase);
      let mods = p._items;
      let rub = 0;

      for (let it of mods) {
        rub += helper_f.getTemplatePrice(it._tpl);
      }

      mods[0].upd = mods[0].upd || {}; // append the stack count
      mods[0].upd.StackObjectsCount = offer.items[0].upd.StackObjectsCount;

      offer._id = p._id; // The offer's id is now the preset's id
      offer.root = mods[0]._id; // Sets the main part of the weapon
      offer.items = mods;
      offer.items[0].upd.StackObjectsCount = utility.getRandomInt(0, 1);// utility.getRandomInt(1, 25);
      delete offer.buyRestrictionMax
      // ~~ = Math.round
      offer.requirements[0].count = ~~(rub * ragfairMultiplier);
      // randomize the name
      offer.user.nickname = global.utility.getArrayValue(global._database.bots.names.normal);
      offers.push(offer);
      //console.log("offer:", offer)
    }
  }

  // Single item
  if (!preset_f.handler.hasPreset(template) || !onlyFunc) {
    let offer = utility.DeepCopy(offerBase);

    //~~ = Math.round
    let rubPrice = ~~(helper_f.getTemplatePrice(template) * ragfairMultiplier);
    offer._id = template;
    offer.items[0]._tpl = template;
    offer.items[0].upd.StackObjectsCount = utility.getRandomInt(minItemsInOffer, maxItemsInOffer);
    offer.requirements[0].count = rubPrice;
    offer.itemsCost = rubPrice;
    offer.requirementsCost = rubPrice;
    offer.summaryCost = rubPrice;
    delete offer.buyRestrictionMax
    // randomize the name
    offer.user.nickname = global.utility.getArrayValue(DatabaseController.getDatabase().bots.names.normal);
    offers.push(offer);
  }

  return offers;
}

function getFleaMarketOffersFromPlayers(sessionID, request) {
  let jsonToReturn = { categories: {}, offers: [] }

  for(const acc of AccountController.getAllAccounts()) {

    const profile = AccountController.getPmcProfile(acc._id);
    if(profile.RagfairInfo)
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


function getRagfairMarketPrice(request) {
  return { min: 0, max: 0, avg: 0 };
}

function ragFairAddOffer(request) {
  return null;
}

module.exports.getOffers = getOffers;
module.exports.ragFairAddOffer = ragFairAddOffer;
