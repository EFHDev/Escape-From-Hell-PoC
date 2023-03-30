"use strict";
const { DatabaseController } = require('../Controllers/DatabaseController');
//const { QuestEvent } = require('../Controllers/QuestController')
const { AccountController } = require('./../Controllers/AccountController')

/*
 * Quest status values
 * 0 - Locked
 * 1 - AvailableForStart
 * 2 - Started
 * 3 - AvailableForFinish
 * 4 - Success
 * 5 - Fail
 * 6 - FailRestartable
 * 7 - MarkedAsFailed
 */

const getQuestsCache = () => fileIO.stringify(global._database.quests, true);

function evaluateLevel(pmcProfile, cond) {
  const level = pmcProfile.Info.Level;
  if (cond._parent === "Level") {
    switch (cond._props.compareMethod) {
      case ">=":
        return level >= cond._props.value;
      default:
        Logger.debug(`Unrecognised Comparison Method: ${cond._props.compareMethod}`);
        return false;
    }
  }
}
module.exports.evaluateLevel = evaluateLevel;

/**
 * 
 * @param {*} q "Quest" object
 * @param {*} questType "Level", "Quest" or "TraderLoyalty"
 * @returns {object}
 */
function filterConditions(q, questType) {
  const filteredQuests = q.filter(c => {
    if (c._parent === questType) {

      return true;
    }
    return false;
  });

  return filteredQuests;
}
module.exports.filterConditions = filterConditions;

const questStatus = () => {
  return {
    "Locked": 0,
    "AvailableForStart": 1,
    "Started": 2,
    "AvailableForFinish": 3,
    "Success": 4,
    "Fail": 5,
    "FailRestartable": 6,
    "MarkedAsFailed": 7
  };
}

/**
 * Retreives the list of Quests for the player (sessionID) provided
 * @param {*} url 
 * @param {*} info 
 * @param {*} sessionID 
 * @returns {Array} list of quests
 */
function getQuestsForPlayer(url, info, sessionID) {

  let quests = [];

  const _profile = AccountController.getPmcProfile(sessionID);
  let quest_database = utility.DeepCopy(global._database.quests);
  const side = _profile.Info.Side;

  let count = 0;

  // for (const q in quest_database) {
  q: for (const quest of quest_database) {

    // let quest = quest_database[q];

    // if (_profile.Quests.some(q => q.qid == quest._id)) {
    //   quests.push(quest);
    // }

    const startLevel = filterConditions(quest.conditions.AvailableForStart, "Level");
    if (startLevel.length) {
      if (!evaluateLevel(_profile, startLevel[0])) {
        continue q;
      }
    }
    const finishLevel = filterConditions(quest.conditions.AvailableForFinish, "Level");
    if (finishLevel.length) {
      if (!evaluateLevel(_profile, finishLevel[0])) {
        continue q;
      }
    }

    const questRequirements = filterConditions(quest.conditions.AvailableForStart, "Quest");
    const questRequirementsFinish = filterConditions(quest.conditions.AvailableForFinish, "Quest");
    const loyaltyRequirements = filterConditions(quest.conditions.AvailableForStart, "TraderLoyalty");
    const loyaltyRequirementsFinish = filterConditions(quest.conditions.AvailableForFinish, "TraderLoyalty");

    // if (questRequirements.length === 0 && loyaltyRequirements.length === 0 && loyaltyRequirementsFinish.length === 0) {
    //   quests.push(quest);
    //   continue q;
    // }

    let completedPreviousQuest = true;
    qR: for (const condition of questRequirements) {
      const previousQuest = _profile.Quests.find(pq => pq.qid == condition._props.target);

      if (!previousQuest) {
        completedPreviousQuest = false;
        break;
      }

      if (previousQuest.status === Object.keys(questStatus)[condition._props.status[0]]) {
        continue qR;
      }

      completedPreviousQuest = false;
      continue q;
    }

    let loyaltyCheck = true;
    for (const condition of loyaltyRequirements) {

      const result = () => {
        const requiredLoyalty = condition._props.value;
        const operator = condition._props.compareMethod;
        if(_profile.TradersInfo && _profile.TradersInfo[condition._props.target]) {
          const currentLoyalty = _profile.TradersInfo[condition._props.target].loyaltyLevel;

          switch (operator) {
            case ">=":
              return currentLoyalty >= requiredLoyalty;
            case "<=":
              return currentLoyalty <= requiredLoyalty;
            case "==":
              return currentLoyalty === requiredLoyalty;
            case "!=":
              return currentLoyalty !== requiredLoyalty;
            case ">":
              return currentLoyalty > requiredLoyalty;
            case "<":
              return currentLoyalty < requiredLoyalty;
          }
        }
        return false;
      }
      if (!result()) {
        loyaltyCheck = false;
        // break;
        continue q;
      }

    }

    const cleanQuestConditions = (quest) => {
      quest = utility.DeepCopy(quest);
      quest.conditions.AvailableForStart = quest.conditions.AvailableForStart.filter(q => q._parent == "Level");

      return quest;
    }

    if (completedPreviousQuest && loyaltyCheck) {
      quests.push(cleanQuestConditions(quest));
    }

    count++;
  }
  // console.log(quests);
  return quests;
}

function getCachedQuest(qid) {
  for (let quests in global._database.quests) {
    let quest = global._database.quests[quests];
    if (quest._id === qid) {
      return quest;
    }
  }

  return null;
}

function processReward(reward) {
  let rewardItems = [];
  let targets;
  let mods = [];

  // separate base item and mods, fix stacks
  for (let item of reward.items) {
    if (item._id === reward.target) {
      targets = helper_f.splitStack(item);
    } else {
      mods.push(item);
    }
  }

  // add mods to the base items, fix ids
  for (let target of targets) {
    let questItems = [target];

    for (let mod of mods) {
      questItems.push(utility.DeepCopy(mod));
    }

    rewardItems = rewardItems.concat(helper_f.replaceIDs(null, questItems));
  }

  return rewardItems;
}

/** Gets a flat list of reward items for the given quest and state
 * input: quest, a quest object
 * input: state, the quest status that holds the items (Started, Success, Fail)
 * output: an array of items with the correct maxStack
 */
function getQuestRewards(quest, state, pmcData, sessionID) {
  let questRewards = [];
  let output = item_f.handler.getOutput(sessionID);

  for (const reward of quest.rewards[state]) {
    switch (reward.type) {
      case "Item":
        questRewards = questRewards.concat(processReward(reward));
        break;
      case "Experience":
        pmcData.Info.Experience += parseInt(reward.value);
        break;
      case "TraderStanding":
        if (typeof pmcData.TradersInfo[reward.target] == "undefined") {
          pmcData.TradersInfo[reward.target] = {
            salesSum: 0,
            standing: 0,
            unlocked: true,
          };
        }
        pmcData.TradersInfo[reward.target].standing += parseFloat(reward.value);
        break;
      case "TraderUnlock":
        if (utility.isUndefined(pmcData.TradersInfo[reward.target])) {
          pmcData.TradersInfo[reward.target] = {
            salesSum: 0,
            standing: 0,
            unlocked: true,
          };
        }

        pmcData.TradersInfo[reward.target].unlocked = true;
        break;
      case "AssortmentUnlock":
        /*
        items -> holds item to unlock in traders
        traderId -> trader id of the trader you unlock the item to
        loyaltyLevel -> level of the trader you unlock that item on
        target -> _id of the item to unlock (main part)
        */ break;
      case "Counter":
        break;
      case "Location":
        /* not used in game (can lock or unlock location suposedly...) */ break;
      case "Skill":
        const skills = pmcData.Skills.Common.filter((skill) => skill.Id == reward.target);
        for (const Id in skills) {
          pmcData.Skills.Common[Id].Progress += parseInt(reward.value);
        }
        /*	if we gonna use masterings increaser then yea ;)
        let masterings = pmcData.Skills.Mastering.filter(skill => skill.Id == reward.target);
        for(const Id in masterings) {
            pmcData.Skills.Common[Id].Progress += reward.value;
        }
        /*
        {
            "target": "Sniper",
            "value": "300",
            "id": "5d78ce4986f77437f7656bf2",
            "type": "Skill",
            "index": 0
        }
        */
        break;
    }
  }

  output.profileChanges[pmcData._id].experience = pmcData.Info.Experience;
  output.profileChanges[pmcData._id].traderRelations = pmcData.TradersInfo;

  // Quest items are found in raid !!
  for (const questItem of questRewards) {
    if (utility.isUndefined(questItem.upd)) questItem.upd = {};
    questItem.upd["SpawnedInSession"] = true;
  }
  return questRewards;
}

function acceptQuest(pmcData, body, sessionID) {
  const state = "Started";
  let found = false;

  // If the quest already exists, update its status
  for (const quest of pmcData.Quests) {
    if (quest.qid === body.qid) {
      quest.startTime = utility.getTimestamp();
      quest.status = state;
      found = true;
      break;
    }
  }

  // Otherwise, add it
  if (!found) {
    pmcData.Quests.push({
      qid: body.qid,
      startTime: utility.getTimestamp(),
      status: state,
    });
  }

  // Create a dialog message for starting the quest.
  // Note that for starting quests, the correct locale field is "description", not "startedMessageText".
  const quest = getCachedQuest(body.qid);
  if(quest === undefined)
    return item_f.handler.getOutput(sessionID);

  const accountLang = AccountController.getAccountLang(sessionID)

  const globalLocales = locale_f.handler.getGlobal(accountLang, false, sessionID);
  
  let questLocale = globalLocales.quest;

  if(questLocale === undefined)
    return item_f.handler.getOutput(sessionID);

  questLocale = questLocale[body.qid];

  if(questLocale === undefined)
    return item_f.handler.getOutput(sessionID);

  const questRewards = getQuestRewards(quest, state, pmcData, sessionID);

  let messageContent = {
    templateId: globalLocales.mail[questLocale.startedMessageText],
    type: dialogue_f.getMessageTypeValue("questStart"),
    maxStorageTime: global._database.gameplay.other.RedeemTime * 3600,
  }

  if (typeof messageContent.templateId == "undefined" || questLocale.startedMessageText === "") {
    messageContent = {
      templateId: globalLocales.mail[questLocale.description],
      type: dialogue_f.getMessageTypeValue("questStart"),
      maxStorageTime: global._database.gameplay.other.RedeemTime * 3600,
    };
  }
  dialogue_f.handler.addDialogueMessage(quest.traderId, messageContent, sessionID, questRewards);

  //QuestEvent.emit('accepted', quest);

  return item_f.handler.getOutput(sessionID);
}

function completeQuest(pmcData, body, sessionID) {
  const state = "Success";
  let intelCenterBonus = 0; //percentage of money reward

  //find if player has money reward boost
  for (const area of pmcData.Hideout.Areas) {
    if (area.type === 11) {
      if (area.level === 1) {
        intelCenterBonus = 5;
      }

      if (area.level > 1) {
        intelCenterBonus = 15;
      }
    }
  }

  for (const quest in pmcData.Quests) {
    if (pmcData.Quests[quest].qid === body.qid) {
      pmcData.Quests[quest].status = state;
      break;
    }
  }

  //Check if any of linked quest is failed, and that is unrestartable.
  for (const quest of pmcData.Quests) {
    if (!(quest.status === "Locked" || quest.status === "Success" || quest.status === "Fail")) {
      const checkFail = getCachedQuest(quest.qid);
      if(checkFail) {
        for (let failCondition of checkFail.conditions.Fail) {
          if (checkFail.restartable === false && failCondition._parent === "Quest" && failCondition._props.target === body.qid) {
            quest.status = "Fail";
          }
        }
      }
    }
  }

  // give reward
  let quest = getCachedQuest(body.qid);
  const locale = AccountController.getAccountLang(sessionID);

  if (intelCenterBonus > 0) {
    quest = applyMoneyBoost(quest, intelCenterBonus); //money = money + (money*intelCenterBonus/100)
  }

  let questRewards = getQuestRewards(quest, state, pmcData, sessionID);
  let output = item_f.handler.getOutput(sessionID);

  // Create a dialog message for completing the quest.
  const locales = DatabaseController.getDatabase().locales;
  if(!locales)
    return output;

  let questLocale = locales.global[locale].quest;
  if(!questLocale)
    return output;

  questLocale = questLocale[body.qid];
  let messageContent = {
    templateId: questLocale.successMessageText,
    type: dialogue_f.getMessageTypeValue("questSuccess"),
    maxStorageTime: global._database.gameplay.other.RedeemTime * 3600,
  };
  if (typeof output.profileChanges[pmcData._id].quests == "undefined") output.profileChanges[pmcData._id].quests = [];
  let questForPlayerToUpdate = utility.DeepCopy(quest);
  questForPlayerToUpdate.conditions.AvailableForStart = [];
  questForPlayerToUpdate.conditions.AvailableForFinish = [];
  questForPlayerToUpdate.conditions.Fail = [];
  output.profileChanges[pmcData._id].quests.push(questForPlayerToUpdate);

  //output.profileChanges[pmcData._id].quests[0]["status"] = "Success"; // there is no other way to finish quest for now (if there will be then it need ot be changed to proper status)
  item_f.handler.setOutput(output);
  dialogue_f.handler.addDialogueMessage(quest.traderId, messageContent, sessionID, questRewards);

  // QuestEvent.emit('completed', quest);

  return output;
}

function handoverQuest(pmcData, body, sessionID) {
  const quest = getCachedQuest(body.qid);
  let output = item_f.handler.getOutput(sessionID);
  const types = ["HandoverItem", "WeaponAssembly"];
  let handoverMode = true;
  let value = 0;
  let counter = 0;
  let amount;

  // Set the counter to the backend counter if it exists.
  for (let k in pmcData.BackendCounters) {
    if (pmcData.BackendCounters[k].qid === body.qid) {
      if (pmcData.BackendCounters[k].id === body.conditionId) {
        try {
          counter = pmcData.BackendCounters[k].value > 0 ? pmcData.BackendCounters[k].value : 0;
        } catch (_) { }
      }
    }
  }

  for (const condition of quest.conditions.AvailableForFinish) {
    if (condition._props.id === body.conditionId && types.includes(condition._parent)) {
      value = parseInt(condition._props.value);
      handoverMode = condition._parent === types[0];
      break;
    }
  }

  if (handoverMode && value === 0) {
    logger.logError(`Quest handover error: condition not found or incorrect value. qid=${body.qid}, condition=${body.conditionId}`);
    return output;
  }

  for (const itemHandover of body.items) {
    // remove the right quantity of given items
    amount = Math.min(itemHandover.count, value - counter);
    counter += amount;
    if (itemHandover.count - amount >= 0) {
      changeItemStack(pmcData, itemHandover.id, itemHandover.count - amount, output);

      if (counter === value || counter > value) {
        break;
      }
    } else {
      // for weapon handover quests, remove the item and its children.
      const toRemove = helper_f.findAndReturnChildren(pmcData, itemHandover.id);
      let index = pmcData.Inventory.items.length;

      // important: don't tell the client to remove the attachments, it will handle it
      if (typeof output.profileChanges[pmcData._id].items.del == "undefined") output.profileChanges[pmcData._id].items.del = [];
      output.items.del.push({ _id: itemHandover.id });
      counter = 1;

      // important: loop backward when removing items from the array we're looping on
      while (index-- > 0) {
        if (toRemove.includes(pmcData.Inventory.items[index]._id)) {
          pmcData.Inventory.items.splice(index, 1);
        }
      }
    }
  }

  if (body.conditionId in pmcData.BackendCounters) {
    pmcData.BackendCounters[body.conditionId].value = counter;
  } else {
    pmcData.BackendCounters[body.conditionId] = { id: body.conditionId, qid: body.qid, value: counter };
  }

  return output;
}

function applyMoneyBoost(quest, moneyBoost) {
  for (const reward of quest.rewards.Success) {
    if (reward.type === "Item") {
      if (helper_f.isMoneyTpl(reward.items[0]._tpl)) {
        //Math.round
        reward.items[0].upd.StackObjectsCount += ~~((reward.items[0].upd.StackObjectsCount * moneyBoost) / 100);
      }
    }
  }

  return quest;
}

/* Sets the item stack to value, or delete the item if value <= 0 */
// TODO maybe merge this function and the one from customization
function changeItemStack(pmcData, id, value, output) {
  for (const inventoryItem in pmcData.Inventory.items) {
    if (pmcData.Inventory.items[inventoryItem]._id === id) {
      if (value > 0) {
        let item = pmcData.Inventory.items[inventoryItem];

        item.upd.StackObjectsCount = value;
        if (utility.isUndefined(output.profileChanges[pmcData._id].items.change)) output.profileChanges[pmcData._id].items.change = [];
        output.profileChanges[pmcData._id].items.change.push({
          _id: item._id,
          _tpl: item._tpl,
          parentId: item.parentId,
          slotId: item.slotId,
          location: item.location,
          upd: { StackObjectsCount: item.upd.StackObjectsCount },
        });
      } else {
        if (utility.isUndefined(output.profileChanges[pmcData._id].items.del)) output.profileChanges[pmcData._id].items.del = [];
        output.profileChanges[pmcData._id].items.del.push({ _id: id });
        pmcData.Inventory.items.splice(inventoryItem, 1);
      }

      break;
    }
  }
}

function getQuestStatus(pmcData, questID) {
  for (const quest of pmcData.Quests) {
    if (quest.qid === questID) {
      return quest.status;
    }
  }

  return "Locked";
}

module.exports.getQuestsCache = getQuestsCache;
module.exports.getQuestsForPlayer = getQuestsForPlayer;
module.exports.acceptQuest = acceptQuest;
module.exports.completeQuest = completeQuest;
module.exports.handoverQuest = handoverQuest;
module.exports.getQuestStatus = getQuestStatus;