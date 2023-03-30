"use strict";

const { logger } = require("../../core/util/logger");
const { AccountController } = require("../Controllers/AccountController");

function handleBitcoinReproduction(pmcData, sessionID) {
  let output = item_f.handler.getOutput(sessionID);
  keepalive_f.main(sessionID); // Force keepalive call to prevent client/server desync.

  let bitcoin = {
    items: [{ item_id: "59faff1d86f7746c51718c9c", count: 1 }],
    tid: "ragfair",
  };

  if (pmcData.Hideout.Production["5d5c205bd582a50d042a3c0e"].Products.length === 0) {
    logger.logWarning("No bitcoins to collect in profile.");
  }

  pmcData.Hideout.Production["5d5c205bd582a50d042a3c0e"].Products.forEach((_) => {
    output = move_f.addItem(pmcData, bitcoin, sessionID, true);
  });

  // Restart production.
  pmcData.Hideout.Production["5d5c205bd582a50d042a3c0e"].StartTimestamp = utility.getTimestamp();
  pmcData.Hideout.Production["5d5c205bd582a50d042a3c0e"].Products = [];

  return output;
}

function registerProduction(pmcData, body, sessionID) {
  const databaseHideoutProduction = _database.hideout.production.find((production) => production._id === body.recipeId);
  let prodTime = undefined;
  if (databaseHideoutProduction.ProductionTime) {
    prodTime = databaseHideoutProduction.ProductionTime;
  } else {
    prodTime = databaseHideoutProduction.productionTime;
  }
  try {
    pmcData.Hideout.Production[databaseHideoutProduction._id] = {
      Progress: 0,
      inProgress: true,
      RecipeId: body.recipeId,
      Products: [],
      SkipTime: 0,
      ProductionTime: parseInt(prodTime),
      StartTimestamp: utility.getTimestamp(),
    };
  } catch (e) {
    logger.logError(`Attempted to register production of ${body.recipeId}, but no production was found in the profile.`);
  }
}

function applyPlayerUpgradesBonuses(pmcData, bonus) {
  if (bonus.type === "MaximumEnergyReserve") {
    pmcData.Health.Energy.Maximum += bonus.value;
  }
  // other bonuses keept as refference
  // case "EnergyRegeneration":
  // case "HydrationRegeneration":
  // case "HealthRegeneration":
  // case "DebuffEndDelay":
  // case "ScavCooldownTimer": // Implemented.
  // case "QuestMoneyReward":
  // case "InsuranceReturnTime":
  // case "ExperienceRate":
  // case "SkillGroupLevelingBoost":
  // case "RagfairCommission":
  // case "AdditionalSlots":
  // case "UnlockWeaponModification":
  // case "TextBonus":
  // case "FuelConsumption":
  pmcData.Bonuses.push(bonus);
}

// returns HideoutManagement skill level
function getPlayerHideoutSkill(pmcData) {
  for (let skill of pmcData.Skills.Common) {
    if (skill.Id == "HideoutManagement") {
      let calculatedLevel = skill.Progress % 100; // always return full level
      return calculatedLevel;
    }
  }
  return 0;
}

function isHideoutManagementElite(pmcData) {
  return getPlayerHideoutSkill(pmcData) == 51;
}

module.exports.getHideoutSkillDecreasedConsumption = (pmcData) => {
  const hideoutManagementLevel = getPlayerHideoutSkill(pmcData);
/*   let decreasingBonus = 0.5 * hideoutManagementLevel;
  if (decreasingBonus >= 25) {
    decreasingBonus = 25; // for elite
  } */

  return 1 - utility.clamp(0.5 * hideoutManagementLevel, 0 ,25) / 100;
};
module.exports.checkPlayerHideoutBuffsFromSkills = (sessionID) => {
  // requires data t obe finished now is not called anywhere
  let pmcData = profile_f.getPmcProfile(sessionID);
  let countBonusesFuel = 0,
    countBonusesAirFilter = 0,
    countBonusesWaterFilter = 0;

  let isEliteHideoutManagement = isHideoutManagementElite(pmcData);
  if (isEliteHideoutManagement) {
    for (let bonus of pmcData.Bonuses) {
      // fuel tanks
      if (bonus.type == "AdditionalSlots" && bonus.value == 2) {
        if (bonus.icon == "/files/Hideout/icon_hideout_fuelslots.png") {
          // thats just less performance hungry compared to includes or indexof
          countBonusesFuel++;
        }
      }
      // air filters
      if (bonus.type == "AdditionalSlots" && bonus.value == 2) {
        if (bonus.icon == "/files/Hideout/icon_hideout_airslots.png") {
          // thats just less performance hungry compared to includes or indexof
          countBonusesAirFilter++;
        }
      }
      // water filters
      if (bonus.type == "AdditionalSlots" && bonus.value == 2) {
        if (bonus.icon == "/files/Hideout/icon_hideout_waterslots.png") {
          // thats just less performance hungry compared to includes or indexof
          countBonusesWaterFilter++;
        }
      }
    }
    let fuelAreaLevel = pmcData.Hideout.Areas.filter((area) => area.type == 3);
    let AirFilterAreaLevel = pmcData.Hideout.Areas.filter((area) => area.type == 17);
    let WaterFilterAreaLevel = pmcData.Hideout.Areas.filter((area) => area.type == 6);
    if (typeof fuelAreaLevel != "undefined") {
      fuelAreaLevel = fuelAreaLevel.level;
    } else {
      fuelAreaLevel = 0;
    }
    if (typeof AirFilterAreaLevel != "undefined") {
      AirFilterAreaLevel = AirFilterAreaLevel.level;
    } else {
      AirFilterAreaLevel = 0;
    }
    if (typeof WaterFilterAreaLevel != "undefined") {
      WaterFilterAreaLevel = WaterFilterAreaLevel.level;
    } else {
      WaterFilterAreaLevel = 0;
    }
    if (countBonusesFuel == fuelAreaLevel) {
      // add bonus cause there is less then it should be
    }
    if (countBonusesAirFilter == AirFilterAreaLevel) {
      // count should be equal to level
      // add bonus cause there is less then it should be
    }
    if (countBonusesWaterFilter == WaterFilterAreaLevel) {
      // count should be equal to level
      // add bonus cause there is less then it should be
    }
  }
};

module.exports.upgrade = (pmcData, body, sessionID) => {
  let foundHideoutArea = pmcData.Hideout.Areas.find((area) => area.type == body.areaType);
  let databaseHideoutArea = _database.hideout.areas.find((area) => area.type == body.areaType);

  // check if they are properly obrained
  if (!foundHideoutArea) {
    logger.logWarning("Unable to find area in player data by AreaType: " + body.areaType);
    return;
  }
  if (!databaseHideoutArea) {
    logger.logWarning("Unable to find area in database by AreaType: " + body.areaType);
    return;
  }
  const constructionLevel = foundHideoutArea.level + 1;
  if (constructionLevel >= databaseHideoutArea.stages.length) {
    // unable to upgrade cause max level reached
    logger.logWarning(`Unable to upgrade area cause level reached maximum(${constructionLevel}) for area: ${body.areaType}`);
    return;
  }
  // everything seems correct now lets update data and then remove items !!!
  let ctime = databaseHideoutArea.stages[constructionLevel].constructionTime;

  if (ctime > 0) {
    //Math.floor
    const timestamp = ~~ (Date.now() / 1000);

    foundHideoutArea.completeTime = ~~ (timestamp + ctime);
    foundHideoutArea.constructing = true;
  }

  for (let itemToPay of body.items) {
    let itemFromInventory = pmcData.Inventory.items.find((item) => item._id == itemToPay.id);
    if (!itemFromInventory) {
      logger.logWarning("Unable to find items to pay: " + itemToPay.id);
      return;
    }
    // check if item has StackObjectsCount property
    if (itemFromInventory.hasOwnProperty("upd") && itemFromInventory.upd.hasOwnProperty("StackObjectsCount")) {
      // now check if we should substract the amount or just delete the item...
      if (itemFromInventory.upd.StackObjectsCount > itemToPay.count) {
        itemFromInventory.upd.StackObjectsCount -= itemToPay.count;
      } else {
        move_f.removeItem(pmcData, itemFromInventory._id, sessionID);
      }
    } else {
      //StackObjectsCount property missing, deleting item
      logger.logWarning(`StackObjectsCount property missing for ${itemFromInventory._id}, deleting item`);
      move_f.removeItem(pmcData, itemFromInventory._id, sessionID);
    }
  }
  return item_f.handler.getOutput(sessionID);
};

module.exports.upgradeComplete = (pmcData, body, sessionID) => {
  let profileHideoutArea = pmcData.Hideout.Areas.find((area) => area.type == body.areaType);
  const databaseHideoutArea = global._database.hideout.areas.find((area) => area.type == body.areaType);
  if (!profileHideoutArea) {
    logger.logWarning(`Unable to find specified area type ${body.areaType} in profile`);
    return;
  }
  if (!databaseHideoutArea) {
    logger.logWarning(`Unable to find specified area type ${body.areaType} in database`);
    return;
  }
  profileHideoutArea.level++;
  profileHideoutArea.completeTime = 0;
  profileHideoutArea.constructing = false;

  const bonuses = databaseHideoutArea.stages[profileHideoutArea.level].bonuses;
  if (bonuses && bonuses.length > 0) {
    for (let bonus of bonuses) {
      applyPlayerUpgradesBonuses(pmcData, bonus);
    }
  }

  return item_f.handler.getOutput(sessionID);
};

module.exports.putItemsInAreaSlots = (pmcData, body, sessionID) => {
  for (let itemToMove in body.items) {
    for (let inventoryItem of pmcData.Inventory.items) {
      if (body.items[itemToMove].id !== inventoryItem._id) {
        continue;
      }

      for (let area of pmcData.Hideout.Areas) {
        if (area.type !== body.areaType) {
          continue;
        }

        let slot_position = parseInt(itemToMove);
        let slot_to_add = {
          item: [
            {
              _id: inventoryItem._id,
              _tpl: inventoryItem._tpl,
              upd: inventoryItem.upd,
            },
          ],
        };

        if (!(slot_position in area.slots)) {
          area.slots.push(slot_to_add);
        } else {
          area.slots.splice(slot_position, 1, slot_to_add);
        }

        move_f.removeItem(pmcData, inventoryItem._id, sessionID);
      }
    }
  }

  return item_f.handler.getOutput(sessionID);
};

module.exports.takeItemsFromAreaSlots = (pmcData, body, sessionID) => {
  let output = item_f.handler.getOutput(sessionID);

  let profileHideoutArea = pmcData.Hideout.Areas.find((area) => area.type == body.areaType);
  if (!profileHideoutArea) {
    logger.logWarning(`Unable to find hideout area type ${body.areaType} in profile`);
    return;
  }
  if (profileHideoutArea.type === 4) {
    let itemToMove = profileHideoutArea.slots[body.slots[0]].item[0];
    let newReq = {
      item_id: itemToMove._tpl,
      count: 1,
      tid: "ragfair",
    };

    output = move_f.addItem(pmcData, newReq, sessionID);
    pmcData = AccountController.getPmcProfile(sessionID);
    if (typeof output.profileChanges[pmcData._id].items.new != "undefined") {
      output.profileChanges[pmcData._id].items.new[0].upd = itemToMove.upd;
      for (let item of pmcData.Inventory.items) {
        if (item._id == output.profileChanges[pmcData._id].items.new[0]._id) {
          item.upd = itemToMove.upd;
        }
      }
    }
    profileHideoutArea.slots[body.slots[0]] = {
      item: null,
    };
  } else {
    let newReq = {
      item_id: profileHideoutArea.slots[0].item[0]._tpl,
      count: 1,
      tid: "ragfair",
    };

    output = move_f.addItem(pmcData, newReq, sessionID);
    pmcData = AccountController.getPmcProfile(sessionID);
    profileHideoutArea.slots.splice(0, 1);
  }

  return item_f.handler.getOutput(sessionID);
};

module.exports.toggleArea = (pmcData, body, sessionID) => {
  let profileHideoutArea = pmcData.Hideout.Areas.find((area) => area.type == body.areaType);
  if (!profileHideoutArea) {
    logger.logWarning(`Unable to find hideout area type ${body.areaType} in profile`);
    return;
  }
  profileHideoutArea.active = body.enabled;
  return item_f.handler.getOutput(sessionID);
};

module.exports.singleProductionStart = (pmcData, body, sessionID) => {
  registerProduction(pmcData, body, sessionID);

  let output = item_f.handler.getOutput(sessionID);

  for (let itemToDelete of body.items) {
    output = move_f.removeItem(pmcData, itemToDelete.id, sessionID);
  }

  return output;
};

module.exports.continuousProductionStart = (pmcData, body, sessionID) => {
  registerProduction(pmcData, body, sessionID);
  return item_f.handler.getOutput(sessionID);
};

module.exports.scavCaseProductionStart = (pmcData, body, sessionID) => {
  for (let itemToPay of body.items) {
    let itemFromInventory = pmcData.Inventory.items.find(
      (item) => item._id == itemToPay.id,
    );
    if (!itemFromInventory) {
      logger.logWarning("Unable to find items to pay: " + itemToPay.id);
      return;
    }
    // check if item has StackObjectsCount property
    if (itemFromInventory.upd.hasOwnProperty("StackObjectsCount")) {
      // now check if we should substract the amount or just delete the item...
      if (itemFromInventory.upd.StackObjectsCount > itemToPay.count) {
        itemFromInventory.upd.StackObjectsCount -= itemToPay.count;
      } else {
        move_f.removeItem(pmcData, itemFromInventory._id, sessionID);
      }
    } else {
      // no StackObjectsCount property so simply deleting item
      move_f.removeItem(pmcData, itemFromInventory._id, sessionID);
    }
  }

  const databaseHideoutScavcase = _database.hideout.scavcase.find(
    (scavcase) => scavcase._id == body.recipeId,
  );

  //logger.logError(JSON.stringify(databaseHideoutScavcase, null, 2));

  if (!databaseHideoutScavcase) {
    logger.logWarning(
      `Unable to find hideout scavcase ${body.recipeId} in database`,
    );
    return;
  }

  let products = [];

  const filterEndProducts = Object.fromEntries(
    Object.entries(databaseHideoutScavcase["EndProducts"]).filter((arr) => {
      return arr[1].max > 0 && arr[1].min > 0;
    }),
  );
  if (Object.keys(filterEndProducts).length == 0) {
    logger.logWarning(
      `Not found any EndProducts meeting criteria of product.max > 0`,
    );
    return;
  }
  for (let rarity in filterEndProducts) {
    const rollAmountOfRewards = utility.getRandomInt(
      filterEndProducts[rarity].min,
      filterEndProducts[rarity].max,
    );

    logger.logInfo(
      `ScavCase[${rarity}]: ${rollAmountOfRewards} [min:${filterEndProducts[rarity].min},max:${filterEndProducts[rarity].max}]`,
    );

    let objectList = Object.keys(global._database.items);
    let objectArray = [];
    for (let i = 0; i < objectList.length; i++) {
      objectArray.push(global._database.items[objectList[i]]);
    }

    for (let i = 0; i < rollAmountOfRewards; i++) {
      const filteredByRarity = objectArray.filter((item) => {
        let price = helper_f.getTemplatePrice(item._id);

        let itemRarity;
        if (price > 32500) {
          itemRarity = "Superrare";
        } else if (price > 15000) {
          itemRarity = "Rare";
        } else if (price > 2) {
          itemRarity = "Common";
        }
        return itemRarity == rarity;
      });

      if (Object.keys(filteredByRarity).length == 0) {
        logger.logWarning(
          `filteredByRarity returned length of 0 which shouldnt be happening!!!`,
        );
        continue;
      }
      const rolledItem =
        filteredByRarity[
        utility.getRandomIntEx(Object.keys(filteredByRarity).length)
        ];
      if (!rolledItem) {
        // fallback
        i--;
        continue;
      }

      products.push({
        _id: utility.generateNewItemId(),
        _tpl: rolledItem._id,
      });

    }
  }
  let prodTime = undefined;
  if (databaseHideoutScavcase.ProductionTime) {
    prodTime = databaseHideoutScavcase.ProductionTime;
  } else {
    prodTime = databaseHideoutScavcase.productionTime;
  }

  pmcData.Hideout.Production[body.recipeId] = {
    Progress: 0,
    inProgress: true,
    RecipeId: body.recipeId,
    Products: products,
    SkipTime: 0,
    ProductionTime: parseInt(prodTime),
    StartTimestamp: utility.getTimestamp(),
  };

  return item_f.handler.getOutput(sessionID);
};

module.exports.takeProduction = (pmcData, body, sessionID) => {
  let cacheditems = global._database.items;

  let output = item_f.handler.getOutput();
  if (body.recipeId === "5d5c205bd582a50d042a3c0e") {
    return handleBitcoinReproduction(pmcData, sessionID);
  }

  for (let recipe in _database.hideout.production) {
    if (body.recipeId !== _database.hideout.production[recipe]._id) {
      continue;
    }

    // delete the production in profile Hideout.Production
    for (let prod in pmcData.Hideout.Production) {
      if (pmcData.Hideout.Production[prod].RecipeId === body.recipeId) {
        if (body.recipeId === "5d5c205bd582a50d042a3c0e") {
          continue;
        } else {
          delete pmcData.Hideout.Production[prod];
        }
      }
    }

    // create item and throw it into profile
    let id = _database.hideout.production[recipe].endProduct;

    // replace the base item with its main preset
    if (preset_f.handler.hasPreset(id)) {
      id = preset_f.handler.getStandardPreset(id)._id;
    }

    let newReq = {
      item_id: id,
      count: _database.hideout.production[recipe].count,
      tid: "ragfair",
    };

    return move_f.addItem(pmcData, newReq, sessionID, true);
  }

  for (let recipe in _database.hideout.scavcase) {
    if (body.recipeId !== _database.hideout.scavcase[recipe]._id) {
      continue;
    }

    for (let prod in pmcData.Hideout.Production) {
      if (body.recipeId !== pmcData.Hideout.Production[prod].RecipeId) {
        continue;
      }
      //pmcData.Hideout.Production[prod].Products = pmcData.Hideout.Production["141"].Products;
      // give items BEFORE deleting the production
      for (let itemProd of pmcData.Hideout.Production[prod].Products) {
        pmcData = AccountController.getPmcProfile(sessionID);
        let id = itemProd._tpl;
        //if item is a weapon preset, get a random one
        if (preset_f.handler.hasPreset(id)) {
          //id = preset_f.handler.getStandardPreset(id)._id;
          id = preset_f.handler.getRandomPresetIdFromWeaponId(itemProd._tpl);
        }
        let newReq = {
          item_id: id,
          count: 1,
          tid: "ragfair",
        };

        if (cacheditems._type != "Node") {
          if (
            cacheditems[itemProd._tpl]._parent === "5485a8684bdc2da71d8b4567"
          ) {
            console.log("Ammo Found");
            if (cacheditems[itemProd._tpl]._props.StackMaxSize !== 1) {
              console.log("Checking Stack Size");
              let min = cacheditems[itemProd._tpl]._props.StackMinRandom;
              let max = cacheditems[itemProd._tpl]._props.StackMaxRandom * 2;

              newReq.count = utility.getRandomInt(min, max);
              console.log(min, max);
            }
          }
        }

        output = move_f.addItem(pmcData, newReq, sessionID, true);
      }

      delete pmcData.Hideout.Production[prod];
      return output;
    }
  }
};
