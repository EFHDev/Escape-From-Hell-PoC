"use strict";

const { AccountController } = require("../Controllers/AccountController");
const { InsuranceController } = require("../Controllers/InsuranceController");
const { QuestController } = require("../Controllers/QuestController");
const { TradingController } = require("../Controllers/TradingController");
const { tradeHandler, TradeHandler } = require("./trade");

class ItemServer {
  constructor() {
    this.output = "";
    this.routes = {};
    this.routeStructure = {};
    this.resetOutput();
  }

  /* adds route to check for */
  addRoute(route, callback) {
    this.routes[route] = callback;
  }

  updateRouteStruct() {
    this.routeStructure = {
      AddNote: note_f.addNote,
      AddToWishList: wishlist_f.addToWishList,
      ApplyInventoryChanges: move_f.applyInventoryChanges,
      Bind: status_f.bindItem,
      CreateMapMarker: status_f.handleMapMarker,
      CustomizationBuy: customization_f.buyClothing,
      CustomizationWear: customization_f.wearClothing,
      DeleteNote: note_f.deleteNote,
      Eat: health_f.handler.offraidEat,
      EditNote: note_f.editNode,
      Examine: status_f.examineItem,
      Fold: status_f.foldItem,
      Heal: health_f.handler.offraidHeal,
      RestoreHealth: health_f.handler.healthTreatment,
      HideoutContinuousProductionStart: hideout_f.continuousProductionStart,
      HideoutPutItemsInAreaSlots: hideout_f.putItemsInAreaSlots,
      HideoutScavCaseProductionStart: hideout_f.scavCaseProductionStart,
      HideoutSingleProductionStart: hideout_f.singleProductionStart,
      HideoutTakeItemsFromAreaSlots: hideout_f.takeItemsFromAreaSlots,
      HideoutTakeProduction: hideout_f.takeProduction,
      HideoutToggleArea: hideout_f.toggleArea,
      HideoutUpgrade: hideout_f.upgrade,
      HideoutUpgradeComplete: hideout_f.upgradeComplete,
      // Insure: insurance_f.insure,
      Insure: InsuranceController.insure,
      Merge: move_f.mergeItem,
      Move: move_f.moveItem,
      QuestAccept: quest_f.acceptQuest,
      QuestComplete: quest_f.completeQuest,
      QuestHandover: quest_f.handoverQuest,
      RagFairAddOffer: TradingController.addFleaMarketOffer,
      RagFairBuyOffer: TradeHandler.confirmRagfairTrading,
      ReadEncyclopedia: status_f.readEncyclopedia,
      Remove: move_f.discardItem,
      RemoveBuild: weaponbuilds_f.removeBuild,
      RemoveFromWishList: wishlist_f.removeFromWishList,
      Repair: repair_f.main,
      RepeatableQuestChange: QuestController.changeRepeatableQuest,
      SaveBuild: weaponbuilds_f.saveBuild,
      Split: move_f.splitItem,
      Swap: move_f.swapItem,
      Tag: status_f.tagItem,
      Toggle: status_f.toggleItem,
      TraderRepair: repair_f.main,
      TradingConfirm: TradeHandler.confirmTrading,
      Transfer: move_f.transferItem,
    };
  }

  handleRoutes(info, sessionID) {
    this.resetOutput(sessionID);
    let pmcData = AccountController.getPmcProfile(sessionID);

    for (let body of info.data) {
      if (body.Action in this.routes) {
        this.routes[body.Action](pmcData, body, sessionID);
      } else {
        logger.logError(`[UNHANDLED ACTION] ${body.Action} with body ${body}`);
      }
    }

    return this.output;
  }

  getOutput(sessionID) {
    if (this.output === "") {
      this.resetOutput(sessionID);
    }
    if(this.output.profileChanges === undefined)
      this.output.profileChanges = {};

    if(this.output.profileChanges[sessionID] === undefined)
      this.output.profileChanges[sessionID] = {};

    if (this.output.profileChanges[sessionID].items === undefined) {
      this.output.profileChanges[sessionID].items = {};
    }

    return this.output;
  }

  setOutput(data) {
    this.output = data;
  }

  resetOutput(sessionID) {
    if (sessionID == "" || typeof sessionID == "undefined") {
      // logger.logError(`[MISSING SESSION ID] resetOutput(sessionID) is blank or undefined; returning.`);
      return;
    }
    let _profile = AccountController.getPmcProfile(sessionID);
    if (utility.isUndefined(_profile)) {
      // logger.logError(`[MISSING PROFILE] Profile with sessionID: ${sessionID} is missing?`);
      return;
    }
    
    this.output = {
      warnings: [],
      profileChanges: {},
    };
    this.output.profileChanges[_profile._id] = {
      experience: 0,
      items: { change: [], new: [], del: [] }, // stash
      quests: [], // are those current accepted quests ??
      repeatableQuests: [], 
      ragFairOffers: [], // are those current ragfair requests ?
      traderRelations: [], //_profile.TradersInfo
      builds: [], // are those current weapon builds ??
      production: null,
      skills: _profile.Skills,
    };
  }
}

const itemServer = new ItemServer();
module.exports.handler = itemServer;
module.exports.ItemRouter = itemServer;
