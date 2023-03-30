"use strict";
const { logger } = require('../../core/util/logger');
const { AccountController } = require('../Controllers/AccountController');
const { InsuranceController } = require('../Controllers/InsuranceController');
const utility = require('./../../core/util/utility');

class InraidServer {
  constructor() {
    this.players = {};
  }

  addPlayer(sessionID, info) {
    this.players[sessionID] = info;
  }

  getPlayer(sessionID) {
    return this.players[sessionID];
  }

  removePlayer(sessionID) {
    delete this.players[sessionID];
  }

  removeMapAccessKey(offraidData, sessionID) {
    if (typeof offraid_f.handler.getPlayer(sessionID) == "undefined") {
      logger.logWarning("Disabling: Remove map key on entering, cause of offraid_f.handler.players[sessionID] is undefined");
      return;
    }
    let map = global._database.locations[MapNameConversion(sessionID)].base;
    let mapKey = map.AccessKeys[0];

    if (!mapKey) {
      return;
    }

    for (let item of offraidData.profile.Inventory.items) {
      if (item._tpl === mapKey && item.slotId !== "Hideout") {
        let usages = -1;

        if (!helper_f.getItem(mapKey)[1]._props.MaximumNumberOfUsage) {
          usages = 1;
        } else {
          usages = "upd" in item && "Key" in item.upd ? item.upd.Key.NumberOfUsages : -1;
        }

        if (usages === -1) {
          item.upd = { Key: { NumberOfUsages: 1 } };
        } else {
          item.upd.Key.NumberOfUsages += 1;
        }

        if (item.upd.Key.NumberOfUsages >= helper_f.getItem(mapKey)[1]._props.MaximumNumberOfUsage) {
          move_f.removeItemFromProfile(offraidData.profile, item._id, sessionID);
        }

        break;
      }
    }
  }
}

/* adds SpawnedInSession property to items found in a raid */
function markFoundItems(pmcData, profile, isPlayerScav) {
  // thanks Mastah Killah#1650
  // mark items found in raid
  for (let offraidItem of profile.Inventory.items) {
    let found = false;

    // mark new items for PMC and all items for scavs
    if (!isPlayerScav) {
      // check if the item exists in PMC inventory
      for (let item of pmcData.Inventory.items) {
        if (offraidItem._id === item._id) {
          // item found in PMC inventory
          found = true;
          // copy item previous FIR status
          if ("upd" in item && "SpawnedInSession" in item.upd) {
            // tests if offraidItem has the "upd" property. If it exists it copies the previous FIR status if not it creates a new "upd" property with that FIR status
            Object.getOwnPropertyDescriptor(offraidItem, "upd") !== undefined
              ? Object.assign(offraidItem.upd, { SpawnedInSession: item.upd.SpawnedInSession })
              : Object.assign(offraidItem, { upd: { SpawnedInSession: item.upd.SpawnedInSession } }); // overwrite SpawnedInSession value with previous item value or create new value
          }
          // FIR status not found - delete offraidItem's SpawnedInSession if it exists
          else if ("upd" in offraidItem && "SpawnedInSession" in offraidItem.upd) {
            delete offraidItem.upd.SpawnedInSession;
          }
          break;
        }
      }

      // skip to next item if found
      if (found) {
        continue;
      }
    }

    // item not found in PMC inventory, add FIR status to new item
    // tests if offraidItem has the "upd" property. If it exists it updates the FIR status if not it creates a new "upd" property
    Object.getOwnPropertyDescriptor(offraidItem, "upd") !== undefined
      ? Object.assign(offraidItem.upd, { SpawnedInSession: true })
      : Object.assign(offraidItem, { upd: { SpawnedInSession: true } });
  }
  return profile;
}

function RemoveFoundItems(profile) {
  for (let offraidItem of profile.Inventory.items) {
    // Remove the FIR status if the player died and the item marked FIR
    if ("upd" in offraidItem && "SpawnedInSession" in offraidItem.upd) {
      delete offraidItem.upd.SpawnedInSession;
    }

    continue;
  }

  return profile;
}

function setInventory(pmcData, profile) {	
	move_f.removeItemFromProfile(pmcData, pmcData.Inventory.equipment, profile.aid);
	move_f.removeItemFromProfile(pmcData, pmcData.Inventory.questRaidItems, profile.aid);
	move_f.removeItemFromProfile(pmcData, pmcData.Inventory.questStashItems, profile.aid);
	
	profile.Inventory = repairInventoryIDs(profile.Inventory, pmcData.aid);

	x: for (let item of profile.Inventory.items) {
		for (let key in pmcData.Inventory.items) {
			let currid = pmcData.Inventory.items[key]._id;
			if (currid.includes(item._id)) {
				continue x;
			}
		}
		pmcData.Inventory.items.push(item);
	}
	pmcData.Inventory.fastPanel = profile.Inventory.fastPanel;

	return pmcData;
}

function deleteInventory(pmcData, sessionID) {
  let toDelete = [];

  for (let item of pmcData.Inventory.items) {
    // remove normal item
    if (
      (item.parentId === pmcData.Inventory.equipment &&
        item.slotId !== "SecuredContainer" &&
        item.slotId !== "Scabbard" &&
        item.slotId !== "Pockets" &&
        item.slotId !== "Armband" &&
        item.slotId !== "SpecialSlot1" &&
        item.slotId !== "SpecialSlot2" &&
        item.slotId !== "SpecialSlot3" &&
        item.slotId !== "Compass") ||
      item.parentId === pmcData.Inventory.questRaidItems
    ) {
      toDelete.push(item._id);
    }

    // remove pocket insides
    if (item.slotId === "Pockets") {
      for (let pocket of pmcData.Inventory.items) {
        if (pocket.parentId === item._id) {
          toDelete.push(pocket._id);
        }
      }
    }
  }

  if(toDelete.length === 0)
  {
    logger.logError("offraid.js:deleteInventory: found no items to delete!");
  }

  // delete items
  for (let item of toDelete) {
    move_f.removeItemFromProfile(pmcData, item, sessionID);
  }

  pmcData.Inventory.fastPanel = {};
  return pmcData;
}

function MapNameConversion(sessionID) {
  // change names to thenames of location file names that are loaded like that into the memory
  let playerRaidData = offraid_f.handler.getPlayer(sessionID);
  switch (playerRaidData.Location) {
    case "Arena":
      return "develop";
    case "Customs":
      return "bigmap";
    case "Factory":
      if (playerRaidData.Time == "CURR") return "factory4_day";
      else return "factory4_night";
    case "Interchange":
      return "interchange";
    case "Laboratory":
      return "laboratory";
    case "ReserveBase":
      return "rezervbase";
    case "Shoreline":
      return "shoreline";
    case "Woods":
      return "woods";
    case "Lighthouse":
      return "lighthouse";
    case "Private Sector":
      return "privatearea";
    case "Suburbs":
      return "suburbs";
    case "Terminal":
      return "terminal";
    case "Town":
      return "town";
    case "Streets of Tarkov":
      return "tarkovstreets";
    default:
      return playerRaidData.Location;
  }
}

function getSafeSlots() {
  const inventorySlots = [
    "SecuredContainer",
    "Pockets",
    "Armband",
    "SpecialSlot1",
    "SpecialSlot2",
    "SpecialSlot3",
    "SpecialSlot4",
  ];
  return inventorySlots;
}

function getGearSlots() {
  const inventorySlots = [
    "FirstPrimaryWeapon",
    "SecondPrimaryWeapon",
    "Holster",
    "Headwear",
    "Earpiece",
    "Eyewear",
    "FaceCover",
    "ArmorVest",
    "TacticalVest",
    "Backpack",
    "pocket1",
    "pocket2",
    "pocket3",
    "pocket4",
    "SecuredContainer",
    "Pockets",
    "Armband",
    "SpecialSlot1",
    "SpecialSlot2",
    "SpecialSlot3",
    "SpecialSlot4",
  ];
  return inventorySlots;
}

function getPlayerGear(items) {
  // Player Slots we care about
  const inventorySlots = getGearSlots();

  let inventoryItems = [];

  // Get an array of root player items
  for (let item of items) {
    if (inventorySlots.includes(item.slotId)) {
      inventoryItems.push(item);
    }
  }

  // Loop through these items and get all of their children
  let newItems = inventoryItems;
  while (newItems.length > 0) {
    let foundItems = [];

    for (let item of newItems) {
      // Find children of this item
      for (let newItem of items) {
        if (newItem.parentId === item._id) {
          foundItems.push(newItem);
        }
      }
    }

    // Add these new found items to our list of inventory items
    inventoryItems = [...inventoryItems, ...foundItems];

    // Now find the children of these items
    newItems = foundItems;
  }

  return inventoryItems;
}

function getPlayerStash(items) {
  const inventorySlots = ["hideout"];

  let inventoryItems = [];

  // Get an array of root player items
  for (let item of items) {
    if (inventorySlots.includes(item.slotId)) {
      inventoryItems.push(item);
    }
  }

  // Loop through these items and get all of their children
  let newItems = inventoryItems;
  while (newItems.length > 0) {
    let foundItems = [];

    for (let item of newItems) {
      // Find children of this item
      for (let newItem of items) {
        if (newItem.parentId === item._id) {
          foundItems.push(newItem);
        }
      }
    }

    // Add these new found items to our list of inventory items
    inventoryItems = [...inventoryItems, ...foundItems];

    // Now find the children of these items
    newItems = foundItems;
  }

  return inventoryItems;
}


function getPlayerItemsInSlot(items, slotId) {
  // Player Slots we care about
  const inventorySlots = [slotId];

  let inventoryItems = [];

  // Get an array of root player items
  for (let item of items) {
    if (inventorySlots.includes(item.slotId)) {
      inventoryItems.push(item);
    }
  }

  // Loop through these items and get all of their children
  let newItems = inventoryItems;
  while (newItems.length > 0) {
    let foundItems = [];

    for (let item of newItems) {
      // Find children of this item
      for (let newItem of items) {
        if (newItem.parentId === item._id) {
          foundItems.push(newItem);
        }
      }
    }

    // Add these new found items to our list of inventory items
    inventoryItems = [...inventoryItems, ...foundItems];

    // Now find the children of these items
    newItems = foundItems;
  }

  return inventoryItems;
}

function getPlayerItemsNotInSlot(items, slotId) {
  // Player Slots we care about
  const inventorySlots = [slotId];

  let inventoryItems = [];

  // Get an array of root player items
  for (let item of items) {
    if (!inventorySlots.includes(item.slotId)) {
      inventoryItems.push(item);
    }
  }

  // Loop through these items and get all of their children
  let newItems = inventoryItems;
  while (newItems.length > 0) {
    let foundItems = [];

    for (let item of newItems) {
      // Find children of this item
      for (let newItem of items) {
        if (newItem.parentId === item._id) {
          foundItems.push(newItem);
        }
      }
    }

    // Add these new found items to our list of inventory items
    inventoryItems = [...inventoryItems, ...foundItems];

    // Now find the children of these items
    newItems = foundItems;
  }

  return inventoryItems;
}

function getSecuredContainer(items) {
  // Player Slots we care about
  const inventorySlots = ["SecuredContainer"];

  let inventoryItems = [];

  // Get an array of root player items
  for (let item of items) {
    if (inventorySlots.includes(item.slotId)) {
      inventoryItems.push(item);
    }
  }

  // Loop through these items and get all of their children
  let newItems = inventoryItems;

  while (newItems.length > 0) {
    let foundItems = [];

    for (let item of newItems) {
      for (let newItem of items) {
        if (newItem.parentId === item._id) {
          foundItems.push(newItem);
        }
      }
    }

    // Add these new found items to our list of inventory items
    inventoryItems = [...inventoryItems, ...foundItems];

    // Now find the children of these items
    newItems = foundItems;
  }

  return inventoryItems;
}

function saveProgress(offraidData, sessionID) {

  // require('fs').writeFileSync("offraid.json", JSON.stringify(offraidData));

  

  // if (!global._database.gameplayConfig.inraid.saveLootEnabled) {
  //   return;
  // }
  // const isPlayerScav = offraidData.isPlayerScav;
  // // Check for insurance if its enabled on this map
  // if (offraidData === undefined) {
  //   logger.logError("offraidData: undefined");
  //   return;
  // }
  if (offraidData.exit === undefined || offraidData.isPlayerScav === undefined || offraidData.profile === undefined) {
    logger.logError("offraidData: variables are empty... (exit, isPlayerScav, profile)");
    logger.logError(offraidData.exit);
    logger.logError(offraidData.isPlayerScav);
    logger.logError(offraidData.profile);
    return;
  }

  if(offraidData.health === null || offraidData.health === undefined) {
    logger.logError("offraidData: health is undefined");
    return;
  }

  let pmcData = AccountController.getPmcProfile(sessionID);
  
  // if (offraidData.exit === "survived") {
  //   // mark found items and replace item ID's if the player survived
    // offraidData.profile = markFoundItems(pmcData, offraidData.profile, isPlayerScav);
    offraidData.profile = markFoundItems(pmcData, offraidData.profile, false);
  // } else {
  //   //Or remove the FIR status if the player havn't survived
  //   offraidData.profile = RemoveFoundItems(offraidData.profile);
  // }

  // if (isPlayerScav) {
  //   let scavData = profile_f.handler.getScavProfile(sessionID);
  //   scavData = setInventory(scavData, offraidData.profile, sessionID, true);
  //   health_f.handler.initializeHealth(sessionID);
  //   profile_f.handler.setScavProfile(sessionID, scavData);
  //   return;
  //   // ENDING HERE IF SCAV PLAYER !!!!
  // }

  pmcData.Info.Level = offraidData.profile.Info.Level;
  pmcData.Skills = offraidData.profile.Skills;
  pmcData.Stats = offraidData.profile.Stats;
  pmcData.Encyclopedia = offraidData.profile.Encyclopedia;
  pmcData.ConditionCounters = offraidData.profile.ConditionCounters;
  pmcData.Quests = offraidData.profile.Quests;
 
  // // For some reason, offraidData seems to drop the latest insured items.
  // // It makes more sense to use pmcData's insured items as the source of truth.
  // offraidData.profile.InsuredItems = pmcData.InsuredItems;

  // add experience points
  pmcData.Info.Experience += pmcData.Stats.TotalSessionExperience;
  // pmcData.Stats.TotalSessionExperience = 0;

  // // Remove the Lab card

  pmcData = setInventory(pmcData, offraidData.profile);
  if(offraidData.health !== undefined && offraidData.health !== null)
    health_f.handler.saveHealth(pmcData, offraidData.health, sessionID);

  // // remove inventory if player died and send insurance items
  // //TODO: dump of prapor/therapist dialogues that are sent when you die in lab with insurance.
  // const systemMapName = MapNameConversion(sessionID);
  // const insuranceEnabled = global._database.locations[systemMapName].base.Insurance;
  const preRaidGear = getPlayerGear(pmcData.Inventory.items);

  // if (insuranceEnabled) {
  //   // insurance_f.handler.storeLostGear(pmcData, offraidData, preRaidGear, sessionID);
  //   InsuranceController.storeLostGear(pmcData, offraidData, preRaidGear, sessionID);
  // }
  // if (offraidData.exit === "survived") {
  //   let exfils = profile_f.handler.getProfileExfilsById(sessionID);
  //   exfils[systemMapName] = exfils[systemMapName] + 1;
  //   profile_f.handler.setProfileExfilsById(sessionID, exfils);
  // }
  if (offraidData.exit !== "survived" && offraidData.exit !== "runner") {
    InsuranceController.storeLostGear(pmcData, offraidData, preRaidGear, sessionID);
    pmcData = deleteInventory(pmcData, sessionID);

    //remove completed conditions related to QuestItem to avoid causing the item not spawning
		AccountController.getPmcProfile(sessionID).Quests = removeLooseQuestItemsConditions(AccountController.getPmcProfile(sessionID));
    
    //Delete carried quests items
    offraidData.profile.Stats.CarriedQuestItems = [];
  }
  // if (insuranceEnabled) {
  //   insurance_f.handler.sendInsuredItems(pmcData, sessionID);
  // }

  // offraid_f.handler.removeMapAccessKey(offraidData, sessionID);
  offraid_f.handler.removePlayer(sessionID);

  AccountController.profiles[sessionID]["pmc"] = pmcData;
  // Ensure the profile saves!
  AccountController.saveToDisk(sessionID);
}

//takes a profile and checks/remove for completed conditions in profile's quests section, that are
//related to a quest item which you don't have or that you lost in a raid.
//example: Extortionist's Folder.
//returns cleaned quests section.
function removeLooseQuestItemsConditions(profile) {
	let dateNow = Date.now();
	let curQuests = utility.DeepCopy(profile.Quests);
	for (let i = 0; i < curQuests.length; i++) {
		//if active quest
		if (curQuests[i].status === "Started") {
			for (let k = 0; k < curQuests[i].completedConditions.length; k++) {
				if (isConditionRelatedToQuestItem(curQuests[i].completedConditions[k], curQuests[i].qid)) {
					//if true : remove completed condition
					//curQuests[i].completedConditions[k] = "";
					/*
					logger.logWarning(
						"Condition ("+curQuests[i].completedConditions[k]+") related to quest ("+curQuests[i].qid+") item found in profile."
					);
					*/
					logger.logWarning(
						`\nQuest (${curQuests[i].qid}) item related condition (${curQuests[i].completedConditions[k]}) \nFound in profile (${profile.aid}). Removing.`
					);
					curQuests[i].completedConditions.splice(k, 1);
				}
			}
		}
	}

	logger.logSuccess(`Quest conditions cleaned (${Date.now() - dateNow}ms).`);
	return curQuests;
}

//function that a quest condition id (found in pmc profile)
//and a questId to check if the quest is related to an item that needs to be found in raid.
//returns false if the condition is not related to item
function isConditionRelatedToQuestItem(conditionId, questId) {
	let cachedQuest = undefined;
	//iterate quests to find the desired quest by questId and save it locally
	for (let quest of global._database.quests) {
		if (quest._id === questId) {
			cachedQuest = utility.DeepCopy(quest);
		}
	}
	if(cachedQuest){
		//iterate quest conditions that are relevant
		for (let condAFF of cachedQuest.conditions.AvailableForFinish) {
			if (condAFF._props.id === conditionId) {
				//if quest condition is of "FindItem" nature, then it's related to an item found in raid.
				if (condAFF._parent === "FindItem") {
					//if that item is an item with QuestItem = true
					if (global._database.items[condAFF._props.target[0]]._props.QuestItem === true) {
						return true;
					}
				}
			}
		}
	}else{
		logger.logWarning("isConditionRelatedToQuestItem: No matching quest was found.");
	}
	
	return false;
}

/**
 * Function that checks for duplicates inside the required parameters and
 * repairs them by creating new IDs. Repairs recursively child items whose parents
 * had their IDs changed.
 * Returns repaired version of the inventory object.
 * @param {offraidData.profile.Inventory} pInv The inventory object which needs repairing.
 * @param {pmcData.aid} AID The account ID for which the items are being repaired. Used for logging and debugging.
 * @author CQInmanis
 */
 function repairInventoryIDs(pInv, AID){

	// Don't count important IDs as errors.
	const ignoreIDs = [
		"60de0d80c6b34f52845b4646",		//?
		"61b7367440281631fc83f17f" 		//sorting table
	];

	// from : "", to : ""
	let repairedIDs = [];
	
	// repair in-raid created IDs (looking like pmcAID) by creating
	// new ids and pointing children to the new id
	for(let item of pInv.items){
		//if item does not need fixing or is in ignore list, skip.
		if(!item._id.includes("pmcAID") || ignoreIDs.includes(item._id)){
			continue;
		}
		//store original id before repairing
		let ogID = item._id;
		//repair ID
		// item._id = utility.generateNewItemId();
		item._id = utility.generateNewId("", 3);

		//add to repaired list for debugging purposes.
		repairedIDs.push({
			from 	: ogID,
			to		: item._id
		});

		// check for children whose parentId was the item's original ID
		// and replace it with the new id
		for(let iitem of pInv.items) {
			if(iitem.parentId !== undefined && iitem.parentId.includes(ogID)){
				iitem.parentId = item._id;
			}
      // else if(iitem.parentId === undefined) {
			// 	iitem.parentId = item._id;
      // }
		}
	}
	if(repairedIDs.length > 0){
		logger.logWarning("Repaired IDs for "+AID+":\n"+JSON.stringify(repairedIDs, null, 2));
	}
	return pInv;
}

module.exports.handler = new InraidServer();
module.exports.saveProgress = saveProgress;
module.exports.getSecuredContainer = getSecuredContainer;
module.exports.getPlayerGear = getPlayerGear;
