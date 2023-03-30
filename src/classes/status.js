"use strict";

const { logger } = require("../../core/util/logger");
const { AccountController } = require("../Controllers/AccountController");
const { DatabaseController } = require("../Controllers/DatabaseController");
const { ItemController } = require("../Controllers/ItemController");
const { TradingController } = require("../Controllers/TradingController");

function foldItem(pmcData, body, sessionID) {
  for (let item of pmcData.Inventory.items) {
    if (item._id && item._id === body.item) {
      item.upd.Foldable = { Folded: body.value };
      return item_f.handler.getOutput(sessionID);
    }
  }

  return "";
}

function toggleItem(pmcData, body, sessionID) {
  for (let item of pmcData.Inventory.items) {
    if (item._id && item._id === body.item) {
      item.upd.Togglable = { On: body.value };
      return item_f.handler.getOutput(sessionID);
    }
  }

  return "";
}

function tagItem(pmcData, body, sessionID) {
  for (let item of pmcData.Inventory.items) {
    if (item._id === body.item) {
      if (item.upd !== null && item.upd !== undefined && item.upd !== "undefined") {
        item.upd.Tag = { Color: body.TagColor, Name: body.TagName };
      } else {
        //if object doesn't have upd create and add it
        let myobject = {
          _id: item._id,
          _tpl: item._tpl,
          parentId: item.parentId,
          slotId: item.slotId,
          location: item.location,
          upd: { Tag: { Color: body.TagColor, Name: body.TagName } },
        };
        Object.assign(item, myobject); // merge myobject into item -- overwrite same properties and add missings
      }

      return item_f.handler.getOutput(sessionID);
    }
  }

  return "";
}

function bindItem(pmcData, body, sessionID) {
  for (let index in pmcData.Inventory.fastPanel) {
    if (pmcData.Inventory.fastPanel[index] === body.item) {
      pmcData.Inventory.fastPanel[index] = "";
    }
  }

  pmcData.Inventory.fastPanel[body.index] = body.item;
  return item_f.handler.getOutput(sessionID);
}

function examineItem(pmcData, body, sessionID) {
  let itemID = body.item;
  let pmcItems = pmcData !== undefined && pmcData.Inventory !== undefined ? pmcData.Inventory.items : [];
  if(pmcData === undefined || pmcData.Inventory === undefined) {
    pmcData = AccountController.getPmcProfile(sessionID);
  }

  if(pmcItems.length > 0) {
    for(const pmcItem of pmcItems) {
      if(pmcItem._id === itemID || pmcItem._tpl === itemID) {
        itemID = pmcItem._tpl;
        break;
      }
    }
  }

  for(const trader of TradingController.getAllTraders()) {
    const assort = TradingController.getTraderAssort(trader.base._id);
    const traderAssortIndex = assort.items.findIndex(x=>x._id === itemID);
    if(traderAssortIndex !== -1) {
      itemID = assort.items[traderAssortIndex]._tpl;
      break;
    }
  }
 




  // ----------------------------------------------------------------
  // item not found
  if (itemID === "") {
    logger.logError(`Cannot find item to examine for ${body.item}`);
    return "";
  }

  // ----------------------------------------------------------------
  // Search through the ItemPresets - This is a check
  for(const itemId in global._database.globals.ItemPresets) {
    const preset = global._database.globals.ItemPresets[itemId];
    const templateItem = helper_f.tryGetItem(preset._items[0]._tpl);
    if(preset._items[0]._id === body.item) {
      itemID = preset._items[0]._id;
      pmcData.Info.Experience += templateItem._props.ExamineExperience;
      pmcData.Encyclopedia[itemID] = true;
      // for(const childItem of ItemController.enumerateItemChildrenRecursively(preset._items[0], preset._items)) {
      //   examineItem(pmcData, { item: childItem._id }, sessionID);
      // }
      return item_f.handler.getOutput(sessionID);
    }
  }

  // ----------------------------------------------------------------
  // item found
  if (typeof global._database.items[itemID] == "undefined") {
    logger.logError(`file not found with id: ${itemID}`);
  }

  let item = global._database.items[itemID];
  // handle issues gracefully for now
  if(item !== undefined) {
    pmcData.Info.Experience += item._props.ExamineExperience;
    pmcData.Encyclopedia[itemID] = true;
    for(const dbId in global._database.items) {
      const dbItem = global._database.items[dbId];
      if(dbItem.parentId === item) {
        pmcData.Info.Experience += dbItem._props.ExamineExperience;
        pmcData.Encyclopedia[dbId] = true;
      }
    }
    // for(const childItem of ItemController.enumerateItemChildrenRecursively(item, global._database.items)) {
    //   examineItem(pmcData, { item: childItem._id }, sessionID);
    // }
  }
  //logger.logSuccess(`EXAMINED: ${itemID}`);
  return item_f.handler.getOutput(sessionID);
}

function readEncyclopedia(pmcData, body, sessionID) {
  for (let id of body.ids) {
    pmcData.Encyclopedia[id] = true;
  }
  return item_f.handler.getOutput(sessionID);
}

function handleMapMarker(pmcData, body, sessionID) {
  for (let k in pmcData.Inventory.items) {
    let curritem = pmcData.Inventory.items[k];
    if (curritem._id === body.item) {
      if (!curritem.upd.Map) {
        curritem.upd.Map = {
          Markers: [],
        };
      }
      curritem.upd.Map.Markers.push(body.mapMarker);
      logger.logInfo(body.mapMarker);
    }
  }

  return item_f.handler.getOutput(sessionID);
}

module.exports.foldItem = foldItem;
module.exports.toggleItem = toggleItem;
module.exports.tagItem = tagItem;
module.exports.bindItem = bindItem;
module.exports.examineItem = examineItem;
module.exports.readEncyclopedia = readEncyclopedia;
module.exports.handleMapMarker = handleMapMarker;
