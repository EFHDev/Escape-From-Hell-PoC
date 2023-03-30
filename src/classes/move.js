"use strict";

const { AccountController } = require("../Controllers/AccountController");

/** Based on the item action, determine whose inventories we should be looking at for from and to.
 * @param body Request to determine
 * @param sessionID SessionID
*/
function getOwnerInventoryItems(body, sessionID) {
  let isSameInventory = false;
  let pmcItems = AccountController.getPmcProfile(sessionID).Inventory.items;
  let scavData = profile_f.handler.getScavProfile(sessionID);
  let fromInventoryItems = pmcItems;
  let fromType = "pmc";

  if ("fromOwner" in body) {
    if (body.fromOwner.id === scavData._id) {
      fromInventoryItems = scavData.Inventory.items;
      fromType = "scav";
    } else if (body.fromOwner.type === "Mail") {
      fromInventoryItems = dialogue_f.handler.getMessageItemContents(body.fromOwner.id, sessionID);
      fromType = "mail";
    }
  }

  // Don't need to worry about mail for destination because client doesn't allow
  // users to move items back into the mail stash.
  let toInventoryItems = pmcItems;
  let toType = "pmc";

  if ("toOwner" in body && body.toOwner.id === scavData._id) {
    toInventoryItems = scavData.Inventory.items;
    toType = "scav";
  }

  if (fromType === toType) {
    isSameInventory = true;
  }

  return {
    from: fromInventoryItems,
    to: toInventoryItems,
    sameInventory: isSameInventory,
    isMail: fromType === "mail",
  };
}

/** Move Item
 * change location of item with parentId and slotId
 * transfers items from one profile to another if fromOwner/toOwner is set in the body.
 * otherwise, move is contained within the same profile_f.
 * @param {*} pmcData 
 * @param {*} body 
 * @param {*} sessionID 
 * @returns {object}
 */
function moveItem(pmcData, body, sessionID) {
  const output = item_f.handler.getOutput(sessionID);
  const inventoryItems = getOwnerInventoryItems(body, sessionID);

  if (inventoryItems.sameInventory) {
    moveItemInternal(inventoryItems.from, body);
  } else {
    moveItemToProfile(inventoryItems.from, inventoryItems.to, body);
  }

  return output;
}

/**
 * 
 * @param {*} pmcData 
 * @param {*} body 
 * @param {*} sessionID 
 */
module.exports.applyInventoryChanges = (pmcData, body, sessionID) => {
  //const output = item_f.handler.getOutput(sessionID);

  if (Symbol.iterator in Object(body.changedItems) && body.changedItems !== null) {
    for (const changed_item of body.changedItems) {
      for (const [key, item] of Object.entries(pmcData.Inventory.items)) {
        if (item._id === changed_item._id) {
          pmcData.Inventory.items[key].parentId = changed_item.parentId;
          pmcData.Inventory.items[key].slotId = changed_item.slotId;
          pmcData.Inventory.items[key].location = changed_item.location;
          break;
        }
      }
    }
  }

};

/** Internal helper function to transfer an item from one profile to another.
 * @param fromItems Item source from source Profile.
 * @param toItems Item source of destination Profile.
 * @param body Move request
 */
function moveItemToProfile(fromItems, toItems, body) {
  handleCartridges(fromItems, body);

  const idsToMove = helper_f.findAndReturnChildrenByItems(fromItems, body.item);

  for (const itemId of idsToMove) {
    for (const itemIndex in fromItems) {
      if (fromItems[itemIndex]._id && fromItems[itemIndex]._id === itemId) {
        if (itemId === body.item) {
          fromItems[itemIndex].parentId = body.to.id;
          fromItems[itemIndex].slotId = body.to.container;

          if ("location" in body.to) {
            fromItems[itemIndex].location = body.to.location;
          } else {
            if (fromItems[itemIndex].location) {
              delete fromItems[itemIndex].location;
            }
          }
        }

        toItems.push(fromItems[itemIndex]);
        fromItems.splice(itemIndex, 1);
      }
    }
  }
}

/** Internal helper function to move item within the same profile_f.
 * @param items Items
 * @param body Move request
 */
function moveItemInternal(items, body) {
  handleCartridges(items, body);

  for (const item of items) {
    if (item._id && item._id === body.item) {
      // don't overwrite camera_ items (happens when loading shells ito mts-255 revolver shotgun)
      if (item.slotId.includes("camora_")) {
        return;
      }
      item.parentId = body.to.id;
      item.slotId = body.to.container;

      if ("location" in body.to) {
        item.location = body.to.location;
      } else {
        if (item.location) {
          delete item.location;
        }
      }

      return;
    }
  }
}

/** Internal helper function to handle cartridges in inventory if any of them exist.
 * @param items Items
 * @param body Move request
 */
function handleCartridges(items, body) {
  // -> Move item to diffrent place - counts with equiping filling magazine etc
  if (body.to.container === "cartridges") {
    let tmp_counter = 0;

    for (const item_ammo in items) {
      if (body.to.id === items[item_ammo].parentId) {
        tmp_counter++;
      }
    }

    body.to.location = tmp_counter; //wrong location for first cartrige
  }
}

/** Remove item of itemId and all of its descendants from profile.
 *  if `sessionID` is passed, this should set an output
 * @param {*} pmcData 
 * @param {*} itemId 
 * @param {*} sessionID Required if you want to update output in item_f
 */
function removeItemFromProfile(pmcData, itemId, sessionID) {
  // get items to remove
  let ids_toremove = helper_f.findAndReturnChildren(pmcData, itemId);
  if(ids_toremove === undefined || ids_toremove.length === 0)
  {
    logger.logError("removeItemFromProfile: found no items to remove!");
    return;
  }

  let output;

  if(sessionID === undefined) {
    logger.logError("removeItemFromProfile: no SessionID parameter provided.");
    return;
  }

  output = item_f.handler.getOutput(sessionID);

  if(output.profileChanges === undefined)
    output.profileChanges = {};

  if(output.profileChanges[pmcData._id] === undefined)
    output.profileChanges[pmcData._id] = {};

  if (output.profileChanges[pmcData._id].items === undefined) {
    output.profileChanges[pmcData._id].items = {};
  }

  //remove one by one all related items and itself
  const toRemoveLast = ids_toremove[ids_toremove.length - 1];
  for (const a in pmcData.Inventory.items) {
    if (pmcData.Inventory.items[a]._id.includes(toRemoveLast)) {
      if (typeof output.profileChanges != "undefined" && output != "") {
        if (typeof output.profileChanges[pmcData._id].items.del == "undefined") output.profileChanges[pmcData._id].items.del = [];
        output.profileChanges[pmcData._id].items.del.push(pmcData.Inventory.items[a]);
      }
    }
  }

  for (let i in ids_toremove) {
    for (let a in pmcData.Inventory.items) {
      if (pmcData.Inventory.items[a]._id.includes(ids_toremove[i])) {
        pmcData.Inventory.items.splice(a, 1);
      }
    }
  }

  // set output if necessary.
  if (sessionID !== undefined && output.hasOwnProperty("profileChanges")) {
    item_f.handler.setOutput(output);
  }
}

/** Remove Item
 * Deep tree item deletion / Delete main item and all sub items with sub items ... and so on.
 * @param {*} profileData 
 * @param {*} body 
 * @param {*} sessionID 
 * @returns {object}
 */
function removeItem(profileData, body, sessionID) {
  let toDo = [body];
  //Find the item and all of it's relates
  if (toDo[0] === undefined || toDo[0] === null || toDo[0] === "undefined") {
    logger.logError(`item id is ${toDo[0]} with body ${body}`);
    return "";
  }

  removeItemFromProfile(profileData, toDo[0], sessionID);
  return item_f.handler.getOutput(sessionID);
}

/** Discard item - with insurance remove
 * 
 * @param {*} pmcData 
 * @param {*} body 
 * @param {*} sessionID 
 * @returns {object}
 */
function discardItem(pmcData, body, sessionID) {
  insurance_f.handler.remove(pmcData, body.item, sessionID);
  return removeItem(pmcData, body.item, sessionID);
}


/**Split Item
 * spliting 1 item-stack into 2 separate items ...
 * @param {Object} pmcData
 * @param {Object} body
 * @param {string} sessionID
 * @returns {object}
 */
function splitItem(pmcData, body, sessionID) {
  const output = item_f.handler.getOutput(sessionID);
  let location = body.container.location;
  const items = getOwnerInventoryItems(body, sessionID);

  if (
    !("location" in body.container) &&
    body.container.container === "cartridges"
  ) {
    let tmp_counter = 0;

    for (const item_ammo in items.to) {
      if (items.to[item_ammo].parentId === body.container.id) {
        tmp_counter++;
      }
    }

    location = tmp_counter; //wrong location for first cartrige
  }

  // The item being merged is possible from three different sources: pmc, scav, or mail.
  for (const item of items.from) {
    if (item._id && item._id === body.item) {
      item.upd.StackObjectsCount -= body.count;

      const newItemId = utility.generateNewItemId();

      output.profileChanges[pmcData._id].items.new.push({
        _id: newItemId,
        _tpl: item._tpl,
        upd: { StackObjectsCount: body.count },
      });

      items.to.push({
        _id: newItemId,
        _tpl: item._tpl,
        parentId: body.container.id,
        slotId: body.container.container,
        location: location,
        upd: { StackObjectsCount: body.count },
      });

      return output;
    }
  }

  return "";
}

/**
 * Merge Item
 * merges 2 items into one, deletes item from `body.item` and adding number of stacks into `body.with`
 *
 * @param {Object} pmcData      - PMC Part of profile
 * @param {Object} body         - Request Body
 * @param {string} sessionID    - Session ID
 * @returns {object}
 */
function mergeItem(pmcData, body, sessionID) {
  const output = item_f.handler.getOutput(sessionID);
  const items = getOwnerInventoryItems(body, sessionID);

  for (const key in items.to) {
    if (items.to[key]._id === body.with) {
      for (const key2 in items.from) {
        if (items.from[key2]._id && items.from[key2]._id === body.item) {
          let stackItem0 = 1;
          let stackItem1 = 1;

          if (!(items.to[key].upd && items.to[key].upd.StackObjectsCount)) {
            items.to[key].upd = { StackObjectsCount: 1 };
          } else if (
            !(items.from[key2].upd && items.from[key2].upd.StackObjectsCount)
          ) {
            items.from[key2].upd = { StackObjectsCount: 1 };
          }

          if (items.to[key].upd !== undefined) {
            stackItem0 = items.to[key].upd.StackObjectsCount;
          }

          if ("upd" in items.from[key2]) {
            stackItem1 = items.from[key2].upd.StackObjectsCount;
          }

          if (stackItem0 === 1) {
            Object.assign(items.to[key], { upd: { StackObjectsCount: 1 } });
          }

          items.to[key].upd.StackObjectsCount = stackItem0 + stackItem1;
          output.profileChanges[pmcData._id].items.del.push({
            _id: items.from[key2]._id,
          });
          items.from.splice(key2, 1);
          return output;
        }
      }
    }
  }
  return "";
}

/** Transfer item - Used to take items from scav inventory into stash or to insert ammo into mags (shotgun ones) and reloading weapon by clicking "Reload"
 * @param {*} pmcData 
 * @param {*} body 
 * @param {*} sessionID 
 * @returns {object}
 */
function transferItem(pmcData, body, sessionID) {
  const output = item_f.handler.getOutput(sessionID);

  let itemFrom = null, itemTo = null;

  for (const iterItem of pmcData.Inventory.items) {
    if (iterItem._id === body.item) {
      itemFrom = iterItem;
    } else if (iterItem._id === body.with) {
      itemTo = iterItem;
    }
    if (itemFrom !== null && itemTo !== null) break;
  }

  if (itemFrom !== null && itemTo !== null) {
    let stackFrom = 1;

    if ("upd" in itemFrom) {
      stackFrom = itemFrom.upd.StackObjectsCount;
    } else {
      Object.assign(itemFrom, { upd: { StackObjectsCount: 1 } });
    }

    if (stackFrom > body.count) {
      itemFrom.upd.StackObjectsCount = stackFrom - body.count;
    } else {
      // Moving a full stack onto a smaller stack
      itemFrom.upd.StackObjectsCount = stackFrom - 1;
    }

    let stackTo = 1;

    if ("upd" in itemTo) {
      stackTo = itemTo.upd.StackObjectsCount;
    } else {
      Object.assign(itemTo, { upd: { StackObjectsCount: 1 } });
    }

    itemTo.upd.StackObjectsCount = stackTo + body.count;
    if (typeof output.profileChanges[pmcData._id].change == "undefined") output.profileChanges[pmcData._id].change = [];
    output.profileChanges[pmcData._id].change.push(itemTo);
  }
  return output;
}

/** Swap Item - its used for "reload" if you have weapon in hands and magazine is somewhere else in rig or backpack in equipment
 * @param {*} pmcData 
 * @param {*} body 
 * @param {*} sessionID 
 * @returns {object}
 */
function swapItem(pmcData, body, sessionID) {
  let output = item_f.handler.getOutput(sessionID);

  for (let iterItem of pmcData.Inventory.items) {
    if (iterItem._id === body.item) {
      iterItem.parentId = body.to.id; // parentId
      iterItem.slotId = body.to.container; // slotId
      iterItem.location = body.to.location; // location
      if (!output.profileChanges[pmcData._id].change) output.profileChanges[pmcData._id].change = [];
      output.profileChanges[pmcData._id].change.push(iterItem);
    }

    if (iterItem._id === body.item2) {
      iterItem.parentId = body.to2.id;
      iterItem.slotId = body.to2.container;
      delete iterItem.location;
      // added this condition to avoid crashing due to array change being empty
      if (!output.profileChanges[pmcData._id].change) output.profileChanges[pmcData._id].change = [];
      output.profileChanges[pmcData._id].change.push(iterItem);
    }
  }

  item_f.handler.setOutput(output);
  return output;
}

function fillAmmoBox(itemToAdd, pmcData, toDo, output) {
  // If this is an ammobox, add cartridges to it.
  // Damaged ammo box are not loaded.
  const itemInfo = helper_f.tryGetItem(itemToAdd._tpl);
  let ammoBoxInfo = itemInfo._props.StackSlots;
  if (ammoBoxInfo !== undefined && itemInfo._name.indexOf("_damaged") < 0) {
    // Cartridge info seems to be an array of size 1 for some reason... (See AmmoBox constructor in client code)
    let maxCount = ammoBoxInfo[0]._max_count;
    let ammoTmplId = ammoBoxInfo[0]._props.filters[0].Filter[0];
    let ammoStackMaxSize = helper_f.tryGetItem(ammoTmplId)._props.StackMaxSize;
    let ammos = [];
    let location = 0;

    while (maxCount > 0) {
      let ammoStackSize = maxCount <= ammoStackMaxSize ? maxCount : ammoStackMaxSize;
      ammos.push({
        _id: utility.generateNewItemId(),
        _tpl: ammoTmplId,
        parentId: toDo[0][1],
        slotId: "cartridges",
        location: location,
        upd: { StackObjectsCount: ammoStackSize },
      });

      location++;
      maxCount -= ammoStackMaxSize;
    }

    if (utility.isUndefined(output.profileChanges[pmcData._id].items.new)) {
      output.profileChanges[pmcData._id].items.new = [];
    }
    [output.profileChanges[pmcData._id].items.new, pmcData.Inventory.items].forEach((x) => x.push.apply(x, ammos));
  }
}

/** Give Item - its used for "add" item to player stash or inventory
 * @param {*} pmcData 
 * @param {*} body 
 * @param {*} sessionID 
 * @param {*} foundInRaid 
 * @returns {object}
 */
function addItem(pmcData, body, sessionID, foundInRaid = false) {
  let output = item_f.handler.getOutput(sessionID);
  // const fenceID = "579dc571d53a0658a154fbec";
  let itemLib = [];
  let itemsToAdd = [];
  if (utility.isUndefined(body.items)) {
    body.items = [{ item_id: body.item_id, count: body.count }];
  }

  for (let baseItem of body.items) {

    switch (true) {

      case (baseItem.item_id in global._database.globals.ItemPresets): //if item is in ItemPresets
        const presetItems = utility.DeepCopy(global._database.globals.ItemPresets[baseItem.item_id]._items);
        itemLib.push(...presetItems);
        baseItem.isPreset = true;
        baseItem.item_id = presetItems[0]._id; //push preset
        break;

      case (helper_f.isMoneyTpl(baseItem.item_id) || (body.tid == "")): //if item_id is money, or tid is empty?
        itemLib.push({ _id: baseItem.item_id, _tpl: baseItem.item_id });
        break;

      default:
        // Only grab the relevant trader items and add unique values
        let isBuyingFromFence = false;
        if (body.tid === "579dc571d53a0658a154fbec") isBuyingFromFence = true;
        const traderItems = trader_f.handler.getAssort(sessionID, body.tid, isBuyingFromFence).items;
        const relevantItems = helper_f.findAndReturnChildrenAsItems(traderItems, baseItem.item_id);
        const toAdd = relevantItems.filter((traderItem) => !itemLib.some((item) => traderItem._id === item._id));
        itemLib.push(...toAdd);
        break;
    }

    for (let item of itemLib) {
      if (item._id === baseItem.item_id) {
        const tmpItem = helper_f.tryGetItem(item._tpl);
        const itemToAdd = {
          itemRef: item,
          count: baseItem.count,
          isPreset: baseItem.isPreset,
        };
        let MaxStacks = 1;

        // split stacks if the size is higher than allowed by StackMaxSize
        if (baseItem.count > tmpItem._props.StackMaxSize) {
          let count = baseItem.count;
          let calc = baseItem.count - ~~(baseItem.count / tmpItem._props.StackMaxSize) * tmpItem._props.StackMaxSize;

          MaxStacks = calc > 0 ? MaxStacks + ~~(count / tmpItem._props.StackMaxSize) : ~~(count / tmpItem._props.StackMaxSize);

          for (let sv = 0; sv < MaxStacks; sv++) {
            if (count > 0) {
              let newItemToAdd = utility.DeepCopy(itemToAdd);
              if (count > tmpItem._props.StackMaxSize) {
                count = count - tmpItem._props.StackMaxSize;
                newItemToAdd.count = tmpItem._props.StackMaxSize;
              } else {
                newItemToAdd.count = count;
              }
              itemsToAdd.push(newItemToAdd);
            }
          }
        } else {
          itemsToAdd.push(itemToAdd);
        }
        // stacks prepared
      }
    }
  }

  // Find an empty slot in stash for each of the items being added
  let StashFS_2D = helper_f.getPlayerStashSlotMap(sessionID, pmcData);
  for (let itemToAdd of itemsToAdd) {
    let itemSize = helper_f.getItemSize(itemToAdd.itemRef._tpl, itemToAdd.itemRef._id, itemLib);
    let findSlotResult = helper_f.findSlotForItem(StashFS_2D, itemSize[0], itemSize[1]);

    if (findSlotResult.success) {
      /* Fill in the StashFS_2D with an imaginary item, to simulate it already being added
       * so the next item to search for a free slot won't find the same one */
      let itemSizeX = findSlotResult.rotation ? itemSize[1] : itemSize[0];
      let itemSizeY = findSlotResult.rotation ? itemSize[0] : itemSize[1];

      try {
        StashFS_2D = helper_f.fillContainerMapWithItem(StashFS_2D, findSlotResult.x, findSlotResult.y, itemSizeX, itemSizeY);
      } catch (err) {
        logger.logError("fillContainerMapWithItem returned with an error" + typeof err === "string" ? ` -> ${err}` : "");
        return helper_f.appendErrorToOutput(output, "Not enough stash space");
      }

      itemToAdd.location = {
        x: findSlotResult.x,
        y: findSlotResult.y,
        rotation: findSlotResult.rotation,
      };
    } else {
      return helper_f.appendErrorToOutput(output, "Not enough stash space");
    }
  }

  // We've succesfully found a slot for each item, let's execute the callback and see if it fails (ex. payMoney might fail)
  try {
    if (typeof callback === "function") {
      callback();
    }
  } catch (err) {
    let message = typeof err === "string" ? err : "An unknown error occurred";
    return helper_f.appendErrorToOutput(output, message);
  }

  for (let itemToAdd of itemsToAdd) {
    let newItem = utility.generateNewItemId();
    let toDo = [[itemToAdd.itemRef._id, newItem]];
    let upd = { StackObjectsCount: itemToAdd.count };

    //if it is from ItemPreset, load preset's upd data too.
    if (itemToAdd.isPreset) {
      for (let updID in itemToAdd.itemRef.upd) {
        upd[updID] = itemToAdd.itemRef.upd[updID];
      }
    }

    // in case people want all items to be marked as found in raid
    if (global._database.gameplay.trading.buyItemsMarkedFound) {
      foundInRaid = true;
    }

    // hideout items need to be marked as found in raid
    if (foundInRaid) {
      upd["SpawnedInSession"] = true;
    }

    if (utility.isUndefined(output.profileChanges[pmcData._id].items.new)) output.profileChanges[pmcData._id].items.new = [];
    
    output.profileChanges[pmcData._id].items.new.push({
      _id: newItem,
      _tpl: itemToAdd.itemRef._tpl,
      parentId: pmcData.Inventory.stash,
      slotId: "hideout",
      location: {
        x: itemToAdd.location.x,
        y: itemToAdd.location.y,
        r: itemToAdd.location.rotation ? 1 : 0,
      },
      upd: upd,
    });

    pmcData.Inventory.items.push({
      _id: newItem,
      _tpl: itemToAdd.itemRef._tpl,
      parentId: pmcData.Inventory.stash,
      slotId: "hideout",
      location: {
        x: itemToAdd.location.x,
        y: itemToAdd.location.y,
        r: itemToAdd.location.rotation ? 1 : 0,
      },
      upd: upd,
    });

    // If this is an ammobox, add cartridges to it.
    if (itemToAdd.itemRef._parent == "543be5cb4bdc2deb348b4568")
    fillAmmoBox(itemToAdd, pmcData, toDo, output);

    while (toDo.length > 0) {
      for (let tmpKey in itemLib) {
        if (itemLib[tmpKey].parentId && itemLib[tmpKey].parentId === toDo[0][0]) {
          newItem = utility.generateNewItemId();

          let SlotID = itemLib[tmpKey].slotId;

          //if it is from ItemPreset, load preset's upd data too.
          if (itemToAdd.isPreset) {
            upd = { StackObjectsCount: itemToAdd.count };
            for (let updID in itemLib[tmpKey].upd) {
              upd[updID] = itemLib[tmpKey].upd[updID];
            }
          }

          if (SlotID === "hideout") {
            if (typeof output.profileChanges[pmcData._id].items.new == "undefined") output.profileChanges[pmcData._id].items.new = [];
            output.profileChanges[pmcData._id].items.new.push({
              _id: newItem,
              _tpl: itemLib[tmpKey]._tpl,
              parentId: toDo[0][1],
              slotId: SlotID,
              location: {
                x: itemToAdd.location.x,
                y: itemToAdd.location.y,
                r: "Horizontal",
              },
              upd: upd,
            });

            pmcData.Inventory.items.push({
              _id: newItem,
              _tpl: itemLib[tmpKey]._tpl,
              parentId: toDo[0][1],
              slotId: itemLib[tmpKey].slotId,
              location: {
                x: itemToAdd.location.x,
                y: itemToAdd.location.y,
                r: "Horizontal",
              },
              upd: upd,
            });
          } else {
            if (typeof output.profileChanges[pmcData._id].items.new == "undefined") output.profileChanges[pmcData._id].items.new = [];
            output.profileChanges[pmcData._id].items.new.push({
              _id: newItem,
              _tpl: itemLib[tmpKey]._tpl,
              parentId: toDo[0][1],
              slotId: SlotID,
              upd: upd,
            });

            pmcData.Inventory.items.push({
              _id: newItem,
              _tpl: itemLib[tmpKey]._tpl,
              parentId: toDo[0][1],
              slotId: itemLib[tmpKey].slotId,
              upd: upd,
            });
          }

          toDo.push([itemLib[tmpKey]._id, newItem]);
        }
      }

      toDo.splice(0, 1);
    }
  }
  item_f.handler.setOutput(output);
  return output;
}

module.exports.moveItem = moveItem;
module.exports.removeItemFromProfile = removeItemFromProfile;
module.exports.removeItem = removeItem;
module.exports.discardItem = discardItem;
module.exports.splitItem = splitItem;
module.exports.mergeItem = mergeItem;
module.exports.transferItem = transferItem;
module.exports.swapItem = swapItem;
module.exports.addItem = addItem;
