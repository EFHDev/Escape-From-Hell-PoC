"use strict";

const { logger } = require("../../core/util/logger");
const { ItemController } = require('./../Controllers/ItemController');

/* A reverse lookup for templates */
function tplLookup() {
  if (tplLookup.lookup === undefined) {
    const lookup = {
      items: {
        byId: {},
        byParent: {},
      },
      categories: {
        byId: {},
        byParent: {},
      },
    };

    for (let x of global._database.templates.Items) {
      lookup.items.byId[x.Id] = x.Price;
      lookup.items.byParent[x.ParentId] || (lookup.items.byParent[x.ParentId] = []);
      lookup.items.byParent[x.ParentId].push(x.Id);
    }

    for (let x of global._database.templates.Categories) {
      lookup.categories.byId[x.Id] = x.ParentId ? x.ParentId : null;
      if (x.ParentId) {
        // root as no parent
        lookup.categories.byParent[x.ParentId] || (lookup.categories.byParent[x.ParentId] = []);
        lookup.categories.byParent[x.ParentId].push(x.Id);
      }
    }

    tplLookup.lookup = lookup;
  }

  return tplLookup.lookup;
}

/** Get template price
 * Explore using itemPriceTable to get price instead of using tplLookup()
 * 
 * @param {string} x  Item ID to get price for
 * @returns  Price of the item
 */
function getTemplatePrice(x) {
  return x in tplLookup().items.byId ? tplLookup().items.byId[x] : 1;
}

/* all items in template with the given parent category */
function templatesWithParent(x) {
  return x in tplLookup().items.byParent ? tplLookup().items.byParent[x] : [];
}

function isCategory(x) {
  return x in tplLookup().categories.byId;
}

function childrenCategories(x) {
  return x in tplLookup().categories.byParent ? tplLookup().categories.byParent[x] : [];
}

/* Made a 2d array table with 0 - free slot and 1 - used slot
 * input: PlayerData
 * output: table[y][x]
 * */
function recheckInventoryFreeSpace(pmcData, sessionID) {
  // recalculate stash taken place
  let PlayerStash = getPlayerStash(sessionID);
  let Stash2D = Array(PlayerStash[1])
    .fill(0)
    .map((x) => Array(PlayerStash[0]).fill(0));

  let inventoryItemHash = getInventoryItemHash(pmcData.Inventory.items);
  if (!inventoryItemHash.byParentId[pmcData.Inventory.stash]) inventoryItemHash.byParentId[pmcData.Inventory.stash] = [];
  for (let item of inventoryItemHash.byParentId[pmcData.Inventory.stash]) {
    if (!("location" in item)) {
      continue;
    }

    let tmpSize = helper_f.getSizeByInventoryItemHash(item._tpl, item._id, inventoryItemHash);
    let iW = tmpSize[0]; // x
    let iH = tmpSize[1]; // y
    let fH = item.location.r === 1 || item.location.r === "Vertical" || item.location.rotation === "Vertical" ? iW : iH;
    let fW = item.location.r === 1 || item.location.r === "Vertical" || item.location.rotation === "Vertical" ? iH : iW;
    let fillTo = item.location.x + fW;

    for (let y = 0; y < fH; y++) {
      // fixed filling out of bound
      //if (item.location.y + y >= PlayerStash[1] && fillTo >= PlayerStash[0])
      //{
      //    continue;
      //}

      try {
        Stash2D[item.location.y + y].fill(1, item.location.x, fillTo);
      } catch (e) {
        logger.log("[STASH]", `Out of bounds for item ${item._id} [${item._id}] with error message: ${e}`);
      }
    }
  }

  return Stash2D;
}

function isMoneyTpl(tpl) {
  const moneyTplArray = ["569668774bdc2da2298b4568", "5696686a4bdc2da3298b456a", "5449016a4bdc2d6f028b456f"];
  return moneyTplArray.findIndex((moneyTlp) => moneyTlp === tpl) > -1;
}

/* Gets currency TPL from TAG
 * input: currency(tag)
 * output: template ID
 * */
function getCurrency(currency) {
  switch (currency) {
    case "EUR":
      return "569668774bdc2da2298b4568";
    case "USD":
      return "5696686a4bdc2da3298b456a";
    default:
      return "5449016a4bdc2d6f028b456f"; // RUB set by default
  }
}

/* Gets Currency to Ruble conversion Value
 * input:  value, currency tpl
 * output: value after conversion
 */
function inRUB(value, currency) {
  return ~~(value * getTemplatePrice(currency));
}

/* Gets Ruble to Currency conversion Value
 * input: value, currency tpl
 * output: value after conversion
 * */
function fromRUB(value, currency) {
  return ~~(value / getTemplatePrice(currency));
}

/* take money and insert items into return to server request
 * input:
 * output: boolean
 * */
function payMoney(pmcData, body, sessionID) {
  let output = item_f.handler.getOutput(sessionID);
  let trader = trader_f.handler.getTrader(body.tid, sessionID);
  let currencyTpl = getCurrency(trader.currency);

  // delete barter things(not a money) from inventory
  if (body.Action === "TradingConfirm") {
    for (let index in body.scheme_items) {
      let item = undefined;

      for (let element of pmcData.Inventory.items) {
        if (body.scheme_items[index].id === element._id) {
          item = element;
        }
      }

      if (item !== undefined) {
        if (!isMoneyTpl(item._tpl)) {
          output = move_f.removeItem(pmcData, item._id, sessionID);
          body.scheme_items[index].count = 0;
        } else {
          currencyTpl = item._tpl;
          break;
        }
      }
    }
  }

  // find all items with currency _tpl id
  const moneyItems = this.findMoney("tpl", pmcData, currencyTpl);

  // prepare a price for barter
  let barterPrice = 0;

  for (let item of body.scheme_items) {
    barterPrice += item.count;
  }


  // prepare the amount of money in the profile
  let amountMoney = 0;

  for (let item of moneyItems) {
    amountMoney += !item.hasOwnProperty("upd") ? 1 : item.upd.StackObjectsCount;
  }

  // if no money in inventory or amount is not enough we return false
  if (amountMoney != 0) {
    if (moneyItems.length <= 0 || amountMoney < barterPrice) {
      return false;
    }
  }

  let leftToPay = barterPrice;

  for (let moneyItem of moneyItems) {
    let itemAmount = !moneyItem.hasOwnProperty("upd") ? 1 : moneyItem.upd.StackObjectsCount; // Handle occurence when there is a stack of 1.

    if (leftToPay >= itemAmount) {
      leftToPay -= itemAmount;
      output = move_f.removeItem(pmcData, moneyItem._id, sessionID);
    } else {
      if (!moneyItem.upd) {
        output = move_f.removeItem(pmcData, moneyItem._id, sessionID);
      } else {
        moneyItem.upd.StackObjectsCount -= leftToPay;
        if (typeof output.profileChanges[pmcData._id].items.change == "undefined") output.profileChanges[pmcData._id].items.change = [];
        output.profileChanges[pmcData._id].items.change.push(moneyItem);
      }
      leftToPay = 0;
    }

    if (leftToPay === 0) {
      break;
    }
  }
  if (typeof pmcData.TradersInfo[body.tid] == "undefined") {
    pmcData.TradersInfo[body.tid] = {
      salesSum: 0,
      standing: 0,
      unlocked: true,
    };
  }
  output.profileChanges[pmcData._id].traderRelations = pmcData.TradersInfo;
  // set current sale sum -- convert barterPrice itemTpl into RUB then convert RUB into trader currency
  pmcData.TradersInfo[body.tid].salesSum += fromRUB(inRUB(barterPrice, currencyTpl), getCurrency(trader.currency));

  // save changes
  logger.logInfo("Items taken. Status OK.");
  item_f.handler.setOutput(output);
  return true;
}

/* Find Barter items in the inventory
 * input: object of player data, string BarteredItem ID
 * output: array of Item from inventory
 * */
function findMoney(by, pmcData, barter_itemID) {
  // find required items to take after buying (handles multiple items)
  const barterIDs = typeof barter_itemID === "string" ? [barter_itemID] : barter_itemID;
  let itemsArray = [];

  for (const barterID of barterIDs) {
    let mapResult = pmcData.Inventory.items.filter((item) => {
      return by === "tpl" ? item._tpl === barterID : item._id === barterID;
    });

    itemsArray = Object.assign(itemsArray, mapResult);
  }

  return itemsArray;
}

/*
 * Finds an item given its id using linear search
 */
function findItemById(items, id) {
  return ItemController.findItemById(items, id);
  // for (let item of items) {
  //   if (item._id === id) {
  //     return item;
  //   }
  // }

  // return false;
}

/* Get item data from items.json
 * input: Item Template ID
 * output: item | { error: true, errorMessage: string }
 */
function tryGetItem(template) {
  const item = global._database.items[template];

  if (typeof item == "undefined") return { error: true, errorMessage: `Unable to find item '${template}' in database` }

  return item;
}

/*
 * Find in the player profile the template of an given id
 * input : character data, item id from inventory
 * output : the whole item object, false if not found
 */
function findInventoryItemById(pmcData, idToFind) {
  for (let item of pmcData.Inventory.items) {
    if (item._id == idToFind) {
      return item;
    }
  }
  return false;
}

/* Recursively checks if the given item is
 * inside the stash, that is it has the stash as
 * ancestor with slotId=hideout
 */
function isItemInStash(pmcData, item) {
  let container = item;

  while ("parentId" in container) {
    if (container.parentId === pmcData.Inventory.stash && container.slotId === "hideout") {
      return true;
    }

    container = findItemById(pmcData.Inventory.items, container.parentId);

    if (!container) {
      break;
    }
  }

  return false;
}

/* receive money back after selling
 * input: pmcData, numberToReturn, request.body,
 * output: none (output is sended to item.js, and profile is saved to file)
 * */
function getMoney(pmcData, amount, body, output, sessionID) {
  let trader = trader_f.handler.getTrader(body.tid, sessionID);
  let currency = getCurrency(trader.currency);
  let calcAmount = fromRUB(inRUB(amount, currency), currency);
  let maxStackSize = global._database.items[currency]._props.StackMaxSize;
  let skip = false;

  for (let item of pmcData.Inventory.items) {
    // item is not currency
    if (item._tpl !== currency) {
      continue;
    }

    // item is not in the stash
    if (!isItemInStash(pmcData, item)) {
      continue;
    }

    if (item.upd.StackObjectsCount < maxStackSize) {
      if (item.upd.StackObjectsCount + calcAmount > maxStackSize) {
        // calculate difference
        calcAmount -= maxStackSize - item.upd.StackObjectsCount;
        item.upd.StackObjectsCount = maxStackSize;
      } else {
        skip = true;
        item.upd.StackObjectsCount = item.upd.StackObjectsCount + calcAmount;
      }

      if (typeof output.profileChanges[pmcData._id].items.change == "undefined") output.profileChanges[pmcData._id].items.change = [];
      output.profileChanges[pmcData._id].items.change.push(item);

      if (skip) {
        break;
      }
      continue;
    }
  }

  if (!skip) {
    let StashFS_2D = recheckInventoryFreeSpace(pmcData, sessionID);

    // creating item
    let stashSize = getPlayerStash(sessionID);

    wholeLoop: for (let My = 0; My <= stashSize[1]; My++) {
      for (let Mx = 0; Mx <= stashSize[0]; Mx++) {
        if (StashFS_2D[My][Mx] !== 0) {
          continue;
        }

        let amount = calcAmount;
        if (amount > maxStackSize) {
          calcAmount -= maxStackSize;
          amount = maxStackSize;
        } else {
          calcAmount = 0;
        }

        let MoneyItem = {
          _id: utility.generateNewItemId(),
          _tpl: currency,
          parentId: pmcData.Inventory.stash,
          slotId: "hideout",
          location: { x: Mx, y: My, r: "Horizontal" },
          upd: { StackObjectsCount: amount },
        };

        pmcData.Inventory.items.push(MoneyItem);
        if (typeof output.profileChanges[pmcData._id].items.new == "undefined") output.profileChanges[pmcData._id].items.new = [];
        output.profileChanges[pmcData._id].items.new.push(MoneyItem);

        if (calcAmount <= 0) {
          break wholeLoop;
        }
      }
    }
  }

  // set current sale sum
  if (typeof pmcData.TradersInfo[body.tid] == "undefined") {
    pmcData.TradersInfo[body.tid] = {
      salesSum: 0,
      standing: 0,
      unlocked: true,
    };
  }
  pmcData.TradersInfo[body.tid].salesSum += amount;
  output.profileChanges[pmcData._id].traderRelations = pmcData.TradersInfo;

  return output;
}

/* Get Player Stash Proper Size
 * input: null
 * output: [stashSizeWidth, stashSizeHeight]
 * */
function getPlayerStash(sessionID) {
  //this sets automaticly a stash size from items.json (its not added anywhere yet cause we still use base stash)
  let stashTPL = profile_f.getStashType(sessionID);
  let stashX = global._database.items[stashTPL]._props.Grids[0]._props.cellsH !== 0 ? global._database.items[stashTPL]._props.Grids[0]._props.cellsH : 10;
  let stashY = global._database.items[stashTPL]._props.Grids[0]._props.cellsV !== 0 ? global._database.items[stashTPL]._props.Grids[0]._props.cellsV : 66;
  return [stashX, stashY];
}

/* Gets item data from items.json
 * input: Item Template ID
 * output: [ItemFound?(true,false), itemData]
 * */
function getItem(template) {
  // -> Gets item from <input: _tpl>
  if (template in global._database.items) {
    return [true, global._database.items[template]];
  }

  return [false, {}];
}

function getInventoryItemHash(InventoryItem) {
  let inventoryItemHash = {
    byItemId: {},
    byParentId: {},
  };

  for (let i = 0; i < InventoryItem.length; i++) {
    let item = InventoryItem[i];
    inventoryItemHash.byItemId[item._id] = item;

    if (!("parentId" in item)) {
      continue;
    }
    if (!(item.parentId in inventoryItemHash.byParentId)) {
      inventoryItemHash.byParentId[item.parentId] = [];
    }
    inventoryItemHash.byParentId[item.parentId].push(item);
  }
  return inventoryItemHash;
}

/* 
note from 2027: there IS a thing i didn't explore and that is Merges With Children
note from Maoci: you can merge and split items from parent-childrens
-> Prepares item Width and height returns [sizeX, sizeY]
*/
module.exports.getSizeByInventoryItemHash = (itemtpl, itemID, inventoryItemHash) => {
  let toDo = [itemID];
  let tmpItem = helper_f.tryGetItem(itemtpl);
  let rootItem = inventoryItemHash.byItemId[itemID];
  if (typeof tmpItem._props == "undefined") { return; }
  let FoldableWeapon = tmpItem._props.Foldable;
  let FoldedSlot = tmpItem._props.FoldedSlot;

  let SizeUp = 0,
    SizeDown = 0,
    SizeLeft = 0,
    SizeRight = 0;
  let ForcedUp = 0,
    ForcedDown = 0,
    ForcedLeft = 0,
    ForcedRight = 0;
  let outX = tmpItem._props.Width,
    outY = tmpItem._props.Height;
  let skipThisItems = ["5448e53e4bdc2d60728b4567", "566168634bdc2d144c8b456c", "5795f317245977243854e041"];
  let rootFolded = rootItem.upd && rootItem.upd.Foldable && rootItem.upd.Foldable.Folded === true;

  //The item itself is collapsible
  if (FoldableWeapon && (FoldedSlot === undefined || FoldedSlot === "") && rootFolded) {
    outX -= tmpItem._props.SizeReduceRight;
  }

  if (!skipThisItems.includes(tmpItem._parent)) {
    while (true) {
      if (toDo.length === 0) {
        break;
      }

      if (toDo[0] in inventoryItemHash.byParentId) {
        for (let item of inventoryItemHash.byParentId[toDo[0]]) {
          //Filtering child items outside of mod slots, such as those inside containers, without counting their ExtraSize attribute
          if (item.slotId.indexOf("mod_") < 0) {
            continue;
          }

          toDo.push(item._id);

          // If the barrel is folded the space in the barrel is not counted
          let itm = helper_f.tryGetItem(item._tpl);
          let childFoldable = itm._props.Foldable;
          let childFolded = item.upd && item.upd.Foldable && item.upd.Foldable.Folded === true;

          if (FoldableWeapon && FoldedSlot === item.slotId && (rootFolded || childFolded)) {
            continue;
          } else if (childFoldable && rootFolded && childFolded) {
            continue;
          }

          // Calculating child ExtraSize
          if (itm._props.ExtraSizeForceAdd === true) {
            ForcedUp += itm._props.ExtraSizeUp;
            ForcedDown += itm._props.ExtraSizeDown;
            ForcedLeft += itm._props.ExtraSizeLeft;
            ForcedRight += itm._props.ExtraSizeRight;
          } else {
            SizeUp = SizeUp < itm._props.ExtraSizeUp ? itm._props.ExtraSizeUp : SizeUp;
            SizeDown = SizeDown < itm._props.ExtraSizeDown ? itm._props.ExtraSizeDown : SizeDown;
            SizeLeft = SizeLeft < itm._props.ExtraSizeLeft ? itm._props.ExtraSizeLeft : SizeLeft;
            SizeRight = SizeRight < itm._props.ExtraSizeRight ? itm._props.ExtraSizeRight : SizeRight;
          }
        }
      }

      toDo.splice(0, 1);
    }
  }

  return [outX + SizeLeft + SizeRight + ForcedLeft + ForcedRight, outY + SizeUp + SizeDown + ForcedUp + ForcedDown];
};

/* Find And Return Children (TRegular)
 * input: PlayerData, InitialItem._id
 * output: list of item._id
 * List is backward first item is the furthest child and last item is main item
 * returns all child items ids in array, includes itself and children
 * */
function findAndReturnChildren(pmcData, itemID) {
  return findAndReturnChildrenByItems(pmcData.Inventory.items, itemID);
}

function findAndReturnChildrenByItems(items, itemID) {
  let list = [];

  for (let childitem of items) {
    if (childitem.parentId !== undefined && childitem.parentId.includes(itemID)) {
      list.push.apply(list, findAndReturnChildrenByItems(items, childitem._id));
    }
  }

  list.push(itemID); // it's required
  return list;
}

/*
 * A variant of findAndReturnChildren where the output is list of item objects instead of their ids.
 * Input: Array of item objects, root item ID.
 * Output: Array of item objects containing root item and its children.
 */
function findAndReturnChildrenAsItems(items, itemID) {
  let list = [];

  for (let childitem of items) {
    // Include itself.
    if (childitem._id === itemID) {
      list.push(childitem);
      continue;
    }

    if (childitem.parentId === itemID) {
      list.push.apply(list, findAndReturnChildrenAsItems(items, childitem._id));
    }
  }
  return list;
}

/* Is Dogtag
 * input: itemId
 * output: bool
 * Checks if an item is a dogtag. Used under profile_f.js to modify preparePrice based
 * on the level of the dogtag
 */
function isDogtag(itemId) {
  return itemId === "59f32bb586f774757e1e8442" || itemId === "59f32c3b86f77472a31742f0";
}

function isNotSellable(itemid) {
  return "544901bf4bdc2ddf018b456d" === itemid || "5449016a4bdc2d6f028b456f" === itemid || "569668774bdc2da2298b4568" === itemid || "5696686a4bdc2da3298b456a" === itemid;
}

/* Gets the identifier for a child using slotId, locationX and locationY. */
function getChildId(item) {
  if (!("location" in item)) {
    return item.slotId;
  }
  return item.slotId + "," + item.location.x + "," + item.location.y;
}

function replaceIDs(pmcData, items, fastPanel = null) {
  // replace bsg shit long ID with proper one
  let string_inventory = fileIO.stringify(items);

  for (let item of items) {
    let insuredItem = false;

    if (pmcData !== null) {
      // insured items shouldn't be renamed
      // only works for pmcs.
      for (let insurance of pmcData.InsuredItems) {
        if (insurance.itemId === item._id) {
          insuredItem = true;
        }
      }

      // do not replace important ID's
      if (item._id === pmcData.Inventory.equipment || item._id === pmcData.Inventory.questRaidItems || item._id === pmcData.Inventory.questStashItems || insuredItem) {
        continue;
      }
    }

    // replace id
    let old_id = item._id;
    let new_id = utility.generateNewItemId();

    string_inventory = string_inventory.replace(new RegExp(old_id, "g"), new_id);
    // Also replace in quick slot if the old ID exists.
    if (fastPanel !== null) {
      for (let itemSlot in fastPanel) {
        if (fastPanel[itemSlot] === old_id) {
          fastPanel[itemSlot] = fastPanel[itemSlot].replace(new RegExp(old_id, "g"), new_id);
        }
      }
    }
  }

  items = JSON.parse(string_inventory);

  // fix duplicate id's
  let dupes = {};
  let newParents = {};
  let childrenMapping = {};
  let oldToNewIds = {};

  // Finding duplicate IDs involves scanning the item three times.
  // First scan - Check which ids are duplicated.
  // Second scan - Map parents to items.
  // Third scan - Resolve IDs.
  for (let item of items) {
    dupes[item._id] = (dupes[item._id] || 0) + 1;
  }

  for (let item of items) {
    // register the parents
    if (dupes[item._id] > 1) {
      let newId = utility.generateNewItemId();

      newParents[item.parentId] = newParents[item.parentId] || [];
      newParents[item.parentId].push(item);
      oldToNewIds[item._id] = oldToNewIds[item._id] || [];
      oldToNewIds[item._id].push(newId);
    }
  }

  for (let item of items) {
    if (dupes[item._id] > 1) {
      let oldId = item._id;
      let newId = oldToNewIds[oldId].splice(0, 1)[0];
      item._id = newId;

      // Extract one of the children that's also duplicated.
      if (oldId in newParents && newParents[oldId].length > 0) {
        childrenMapping[newId] = {};
        for (let childIndex in newParents[oldId]) {
          // Make sure we haven't already assigned another duplicate child of
          // same slot and location to this parent.
          let childId = getChildId(newParents[oldId][childIndex]);
          if (!(childId in childrenMapping[newId])) {
            childrenMapping[newId][childId] = 1;
            newParents[oldId][childIndex].parentId = newId;
            newParents[oldId].splice(childIndex, 1);
          }
        }
      }
    }
  }
  return items;
}

/* split item stack if it exceeds StackMaxSize
 *  input: an item
 *  output: an array of these items with StackObjectsCount <= StackMaxSize
 */
function splitStack(item) {
  if (!("upd" in item) || !("StackObjectsCount" in item.upd)) {
    return [item];
  }

  let maxStack = global._database.items[item._tpl]._props.StackMaxSize;
  let count = item.upd.StackObjectsCount;
  let stacks = [];

  while (count) {
    let amount = Math.min(count, maxStack);
    let newStack = clone(item);

    newStack.upd.StackObjectsCount = amount;
    count -= amount;
    stacks.push(newStack);
  }

  return stacks;
}

function clone(x) {
  return fileIO.parse(fileIO.stringify(x));
}

function arrayIntersect(a, b) {
  return a.filter((x) => b.includes(x));
}

// Searching for first item template ID and for preset ID
function getPreset(id) {
  let itmPreset = global._database.globals.ItemPresets[id];
  if (!itmPreset) {
    logger.logWarning("Preset of id: " + id + " not found on a list (this warning is not important)");
    return null;
  }
  return itmPreset;
}

module.exports.getContainerMap = (containerW, containerH, itemList, containerId) => {
  const container2D = Array(containerH)
    .fill(0)
    .map(() => Array(containerW).fill(0));
  const inventoryItemHash = helper_f.getInventoryItemHash(itemList);

  const containerItemHash = inventoryItemHash.byParentId[containerId];
  if (!containerItemHash) {
    // No items in the container
    return container2D;
  }

  for (const item of containerItemHash) {
    if (!("location" in item)) {
      continue;
    }

    const tmpSize = helper_f.getSizeByInventoryItemHash(item._tpl, item._id, inventoryItemHash);
    const iW = tmpSize[0]; // x
    const iH = tmpSize[1]; // y
    const fH = item.location.r === 1 || item.location.r === "Vertical" || item.location.rotation === "Vertical" ? iW : iH;
    const fW = item.location.r === 1 || item.location.r === "Vertical" || item.location.rotation === "Vertical" ? iH : iW;
    const fillTo = item.location.x + fW;

    for (let y = 0; y < fH; y++) {
      try {
        container2D[item.location.y + y].fill(1, item.location.x, fillTo);
      } catch (e) {
        logger.logError(`[OOB] for item with id ${item._id}; Error message: ${e}`);
      }
    }
  }

  return container2D;
};

module.exports.fillContainerMapWithItem = (container2D, x, y, itemW, itemH, rotate) => {

  if(container2D === undefined)
    throw "WTF, the container2D is Fucked";

  if(x === undefined)
    return container2D;

  if(y === undefined)
    return container2D;


  let itemWidth = rotate ? itemH : itemW;
  let itemHeight = rotate ? itemW : itemH;

  for (let tmpY = y; tmpY < y + itemHeight; tmpY++) {
    for (let tmpX = x; tmpX < x + itemWidth; tmpX++) {
      if (container2D[tmpY][tmpX] === 0) {
        container2D[tmpY][tmpX] = 1;
      } else {
        // logger.throwErr(`Slot at (${x}, ${y}) is already filled`, "src/classes/helper.js 734");
      }
    }
  }
  return container2D;
};
module.exports.findSlotForItem = (container2D, itemWidth, itemHeight) => {
  let rotation = false;
  let minVolume = (itemWidth < itemHeight ? itemWidth : itemHeight) - 1;
  let containerY = container2D.length;
  let containerX = container2D[0].length;
  let limitY = containerY - minVolume;
  let limitX = containerX - minVolume;

  let locateSlot = (x, y, itemW, itemH) => {
    let foundSlot = true;
    for (let itemY = 0; itemY < itemH; itemY++) {
      if (foundSlot && y + itemH > containerY) {
        foundSlot = false;
        break;
      }

      for (let itemX = 0; itemX < itemW; itemX++) {
        if (foundSlot && x + itemW > containerX) {
          foundSlot = false;
          break;
        }

        if (container2D[y + itemY][x + itemX] !== 0) {
          foundSlot = false;
          break;
        }
      }

      if (!foundSlot) break;
    }
    return foundSlot;
  };

  for (let y = 0; y < limitY; y++) {
    for (let x = 0; x < limitX; x++) {
      let foundSlot = locateSlot(x, y, itemWidth, itemHeight);

      /**Try to rotate if there is enough room for the item
       * Only occupies one grid of items, no rotation required
       * */
      if (!foundSlot && itemWidth * itemHeight > 1) {
        foundSlot = locateSlot(x, y, itemHeight, itemWidth);

        if (foundSlot) rotation = true;
      }

      if (!foundSlot) continue;

      return { success: true, x, y, rotation };
    }
  }

  return { success: false, x: null, y: null, rotation: false };
};
module.exports.appendErrorToOutput = (output, message = "An unknown error occurred", title = "Error") => {
  output.warnings = [
    {
      index: 0,
      err: title,
      errmsg: message,
    },
  ];

  return output;
};

module.exports.getItemSize = (itemtpl, itemID, InventoryItem) => {
  // -> Prepares item Width and height returns [sizeX, sizeY]
  return helper_f.getSizeByInventoryItemHash(itemtpl, itemID, this.getInventoryItemHash(InventoryItem));
};

module.exports.getInventoryItemHash = (InventoryItem) => {
  let inventoryItemHash = {
    byItemId: {},
    byParentId: {},
  };

  for (let i = 0; i < InventoryItem.length; i++) {
    let item = InventoryItem[i];
    inventoryItemHash.byItemId[item._id] = item;

    if (!("parentId" in item)) {
      continue;
    }

    if (!(item.parentId in inventoryItemHash.byParentId)) {
      inventoryItemHash.byParentId[item.parentId] = [];
    }
    inventoryItemHash.byParentId[item.parentId].push(item);
  }
  return inventoryItemHash;
};

module.exports.getPlayerStashSlotMap = (sessionID, pmcData) => {
  // recalculate stach taken place
  let PlayerStashSize = getPlayerStash(sessionID);
  let Stash2D = Array(PlayerStashSize[1])
    .fill(0)
    .map((x) => Array(PlayerStashSize[0]).fill(0));

  let inventoryItemHash = helper_f.getInventoryItemHash(pmcData.Inventory.items);

  for (let item of inventoryItemHash.byParentId[pmcData.Inventory.stash]) {
    if (!("location" in item)) {
      continue;
    }

    let tmpSize = helper_f.getSizeByInventoryItemHash(item._tpl, item._id, inventoryItemHash);
    if(tmpSize !== undefined && tmpSize.length == 2) {
      let iW = tmpSize[0]; // x
      let iH = tmpSize[1]; // y
      let fH = item.location.r === 1 || item.location.r === "Vertical" || item.location.rotation === "Vertical" ? iW : iH;
      let fW = item.location.r === 1 || item.location.r === "Vertical" || item.location.rotation === "Vertical" ? iH : iW;
      let fillTo = item.location.x + fW;

      for (let y = 0; y < fH; y++) {
        try {
          Stash2D[item.location.y + y].fill(1, item.location.x, fillTo);
        } catch (e) {
          logger.logError(`[OOB] for item with id ${item._id}; Error message: ${e}`);
        }
      }
    }
    else {
      logger.logError(`Error in getting tempSize for item with id ${item._id}`);
    }
  }

  return Stash2D;
};
// note from 2027: there IS a thing i didn't explore and that is Merges With Children
// -> Prepares item Width and height returns [sizeX, sizeY]
// check if this new one works and remove this one if it does
module.exports.getSizeByInventoryItemHash_old = (itemtpl, itemID, inventoryItemHash) => {
  let toDo = [itemID];
  let tmpItem = helper_f.tryGetItem(itemtpl);

  // Prevent traders not working if an template ID does not fetch a real item. -- kiobu
  // Note: This may cause problems when attempting to place an item in the same/relative place as a broken template item.
  if (JSON.stringify(tmpItem) === "{}") {
    logger.logError(`Could not find item from the given template ID in profile: ${itemtpl}. You should remove this item from your profile.`);
    return []; // Return empty array to continue execution.
  }

  let rootItem = inventoryItemHash.byItemId[itemID];
  let FoldableWeapon = tmpItem._props.Foldable;
  let FoldedSlot = tmpItem._props.FoldedSlot;

  let SizeUp = 0;
  let SizeDown = 0;
  let SizeLeft = 0;
  let SizeRight = 0;

  let ForcedUp = 0;
  let ForcedDown = 0;
  let ForcedLeft = 0;
  let ForcedRight = 0;
  let outX = tmpItem._props.Width;
  let outY = tmpItem._props.Height;
  let skipThisItems = ["5448e53e4bdc2d60728b4567", "566168634bdc2d144c8b456c", "5795f317245977243854e041"];
  let rootFolded = rootItem.upd && rootItem.upd.Foldable && rootItem.upd.Foldable.Folded === true;

  //The item itself is collapsible
  if (FoldableWeapon && (FoldedSlot === undefined || FoldedSlot === "") && rootFolded) {
    outX -= tmpItem._props.SizeReduceRight;
  }

  if (!skipThisItems.includes(tmpItem._parent)) {
    while (toDo.length > 0) {
      if (toDo[0] in inventoryItemHash.byParentId) {
        for (let item of inventoryItemHash.byParentId[toDo[0]]) {
          //Filtering child items outside of mod slots, such as those inside containers, without counting their ExtraSize attribute
          if (item.slotId.indexOf("mod_") < 0) {
            continue;
          }

          toDo.push(item._id);

          // If the barrel is folded the space in the barrel is not counted
          let itm = helper_f.tryGetItem(item._tpl);
          let childFoldable = itm._props.Foldable;
          let childFolded = item.upd && item.upd.Foldable && item.upd.Foldable.Folded === true;

          if (FoldableWeapon && FoldedSlot === item.slotId && (rootFolded || childFolded)) {
            continue;
          } else if (childFoldable && rootFolded && childFolded) {
            continue;
          }

          // Calculating child ExtraSize
          if (itm._props.ExtraSizeForceAdd === true) {
            ForcedUp += itm._props.ExtraSizeUp;
            ForcedDown += itm._props.ExtraSizeDown;
            ForcedLeft += itm._props.ExtraSizeLeft;
            ForcedRight += itm._props.ExtraSizeRight;
          } else {
            SizeUp = SizeUp < itm._props.ExtraSizeUp ? itm._props.ExtraSizeUp : SizeUp;
            SizeDown = SizeDown < itm._props.ExtraSizeDown ? itm._props.ExtraSizeDown : SizeDown;
            SizeLeft = SizeLeft < itm._props.ExtraSizeLeft ? itm._props.ExtraSizeLeft : SizeLeft;
            SizeRight = SizeRight < itm._props.ExtraSizeRight ? itm._props.ExtraSizeRight : SizeRight;
          }
        }
      }

      toDo.splice(0, 1);
    }
  }

  return [outX + SizeLeft + SizeRight + ForcedLeft + ForcedRight, outY + SizeUp + SizeDown + ForcedUp + ForcedDown];
};

/**
 * Tries to place a given item template inside the given container object.
 * Container object must be an array of items with a container table as the first
 * item (index 0).
 * Created specifically for forced loot containers, but may work in other containers.
 * @param {string} itemTpl the item template (generally item._tpl)
 * @param {Array} containerObject Array of items containing at least a table item at index 0
 * @returns containerObject with the given item if it was possible, else, returns original array.
 * @author CQInmanis
 */
function tryPlaceItemInContainer(itemTpl, containerObject) {
  //future use | in development...

  return containerObject;
}

function getDurability(itemTemplate, botRole) {

  let maxDurability = getRandomisedMaxDurability(itemTemplate, botRole);
  let minDurability = getRandomisedMinDurability(itemTemplate, botRole);

}

/**
     * To get type of `durability` to make function more flexible
     *
     * @param {object}      itemTemplate         The item to check Durability-type of

     */
function getDurabilityType(itemTemplate) {
  const _props = itemTemplate._props;
  let durabilityType;

  switch (true) {
    case _props.hasOwnProperty("MaxDurability"):
      durabilityType = "MaxDurability";
      break;

    case _props.hasOwnProperty("MaxResource"):
      durabilityType = "MaxResource";
      break;

    case _props.hasOwnProperty("Durability"):
      durabilityType = "Durability";
      break;

    case _props.hasOwnProperty("MaxHpResource"):
      durabilityType = "MaxHpResource";
      break;

    default:
      logger.logWarning(`${itemTemplate._name} [${itemTemplate._id}] doesn't have a type of durability; skipping`);
      return;
  }

  return durabilityType;
}

/**
     * To get the `max randomized durability` for weapons/armor on AI
     *
     * @param {object}      itemTemplate         The item
     * @param {string}      botRole             Role of Bot, in case we want to add this to the gameplay config for more customization

     */
function getRandomisedMaxDurability(itemTemplate, botRole) {

  //store properties in variable
  const itemProperties = itemTemplate._props;
  const durabilityType = getDurabilityType(itemTemplate); //get type of durability in string

  const percent = utility.getRandomIntInc(90, 100);


  const maxDurability = itemProperties[durabilityType]; //set maxDurability from item
  const randomMaxDurability = utility.getPercentOf(percent, maxDurability);
  return utility.decimalAdjust("round", randomMaxDurability, -1);
}

/**
     * To get the `min randomized durability` for weapons/armor on AI
     *
     * @param {number}      maxDurability       Max Durability from getRandomisedMaxDurability
     * @param {string}      botRole             Role of Bot, in case we want to add this to the gameplay config for more customization

     */
function getRandomisedMinDurability(maxDurability, botRole) {
  const currentDurability = maxDurability;
  const min = 0;
  const max = 10;

  const delta = utility.getRandomIntInc(min, max);
  const randomMinDurability = currentDurability - delta;

  //console.log(randomMinDurability, "getRandomisedMinDurability");
  return utility.decimalAdjust('round', randomMinDurability, -1);
}

/**
     * 
     *
     * @param {number}      maxDurability       Current max condition of item
     * @param {string}      itemTemplate        Item

     */
/** `Adjust reliability` of item based on condition (durability)
 * 
 * @param {*} maxDurability 
 * @param {*} itemTemplate 
 * @param {*} durabilityType 
 * @returns 
 */
function getItemReliability(maxDurability, itemTemplate, durabilityType) {
  //increase malfunction chance on low durability items
  const itemProperties = itemTemplate._props;
  let itemMaxDurability;
  let minDurability = maxDurability;

  console.log(minDurability)

  if (itemProperties.hasOwnProperty("MalfunctionChance")) {
    //check for durability type Durability so that we can see if it has MalfunctionChance
    if (durabilityType == "MaxDurability") {
      /*
      We're now going to adjust MalfunctionChance based on the percentage difference between
      the original MaxDurability and NewDurability, then increase the MalfunctionChance based
      on the percentage difference of the durabilities and the original MalfunctionChance 
      */

      const malfunctionChance = itemProperties.MalfunctionChance; //default malfunction chance
      let currentMalfunctionChance;


      itemMaxDurability = itemProperties.Durability;
      console.log(itemMaxDurability, "itemMaxDurability")
      console.log(minDurability, "minDurability")


      //let newDurability = itemMaxDurability * utility.getPercentOf(itemMaxDurability, minDurability);
      const percentDiff = utility.getPercentDiff(itemMaxDurability, minDurability);
      console.log(percentDiff)

      currentMalfunctionChance = malfunctionChance * percentDiff;
      currentMalfunctionChance = currentMalfunctionChance; //we dont need giant decimals

      return currentMalfunctionChance;
    }
  }
}

module.exports.getItemReliability = getItemReliability;
module.exports.getDurabilityType = getDurabilityType;
module.exports.getRandomisedMaxDurability = getRandomisedMaxDurability;
module.exports.getRandomisedMinDurability = getRandomisedMinDurability;
module.exports.tryPlaceItemInContainer = tryPlaceItemInContainer;
module.exports.getPreset = getPreset;
module.exports.getTemplatePrice = getTemplatePrice;
module.exports.templatesWithParent = templatesWithParent;
module.exports.isCategory = isCategory;
module.exports.childrenCategories = childrenCategories;
module.exports.recheckInventoryFreeSpace = recheckInventoryFreeSpace;
module.exports.isMoneyTpl = isMoneyTpl;
module.exports.getCurrency = getCurrency;
module.exports.inRUB = inRUB;
module.exports.fromRUB = fromRUB;
module.exports.payMoney = payMoney;
module.exports.findMoney = findMoney;
module.exports.getMoney = getMoney;
module.exports.getPlayerStash = getPlayerStash;
module.exports.getItem = getItem;
module.exports.tryGetItem = tryGetItem;
module.exports.findAndReturnChildren = findAndReturnChildren;
module.exports.findAndReturnChildrenByItems = findAndReturnChildrenByItems;
module.exports.findAndReturnChildrenAsItems = findAndReturnChildrenAsItems;
module.exports.isDogtag = isDogtag;
module.exports.isNotSellable = isNotSellable;
module.exports.replaceIDs = replaceIDs;
module.exports.splitStack = splitStack;
module.exports.clone = clone;
module.exports.arrayIntersect = arrayIntersect;
module.exports.findInventoryItemById = findInventoryItemById;
module.exports.getInventoryItemHash = getInventoryItemHash;