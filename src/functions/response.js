const { logger } = require("../../core/util/logger");
const { AccountController } = require('../../src/Controllers/AccountController');
const { CustomizationController } = require("../Controllers/CustomizationController");

class Responses {
  constructor() {
    this.staticResponses = {
      // NEW REQUESTS
      // "/client/repeatalbeQuests/activityPeriods": this.clientRepeatableQuestsActivityPeriods,
      "/singleplayer/settings/bot/maxCap": this.dynSingleplayerSettingsBotMaxCap,
      // CORE REQUESTS
      "/client/account/customization": this.clientAccountCustomization,
      "/client/chatServer/list": this.clientChatServerList,
      "/client/checkVersion": this.clientCheckVersion,
      "/client/customization": this.clientCustomization,
      // "/client/friend/list": this.clientFriendList,
      // "/client/friend/request/list/inbox": this.clientFriendRequestListInbox,
      // "/client/friend/request/list/outbox": this.clientFriendRequestListOutbox,
      // "/client/friend/request/send": this.clientFriendRequestSend,
      "/client/game/bot/generate": this.clientGameBotGenerate,
      // "/client/game/config": this.clientGameConfig,
      "/client/game/keepalive": this.clientGameKeepalive,
      // "/client/game/logout": this.clientGameLogout,
      "/client/game/profile/create": this.clientGameProfileCreate,
      "/client/game/profile/items/moving": this.clientGameProfileItemsMoving,
      "/client/game/profile/list": this.clientGameProfileList,
      "/client/game/profile/nickname/change": this.clientGameProfileNicknameChange,
      "/client/game/profile/nickname/reserved": this.clientGameProfileNicknameReserved,
      "/client/game/profile/nickname/validate": this.clientGameProfileNicknameValidate,
      "/client/game/profile/savage/regenerate": this.clientGameProfileSavageRegenerate,
      //"/client/game/profile/search": this.clientGameProfileSearch,
      // "/client/game/profile/select": this.clientGameProfileSelect,
      "/client/game/profile/voice/change": this.clientGameProfileVoiceChange,
      "/client/game/start": this.clientGameStart,
      "/client/game/version/validate": this.clientGameVersionValidate,
      "/client/getMetricsConfig": this.clientGetMetricsConfig,
      "/client/globals": this.clientGlobals,
      "/client/handbook/builds/my/list": this.clientHandbookBuildsMyList,
      "/client/handbook/templates": this.clientHandbookTemplates,
      // "/client/hideout/areas": this.clientHideoutAreas,
      "/client/hideout/production/recipes": this.clientHideoutProductionRecipes,
      "/client/hideout/production/scavcase/recipes": this.clientHideoutProductionScavcaseRecipes,
      "/client/hideout/settings": this.clientHideoutSettings,
      "/client/insurance/items/list/cost": this.clientInsuranceItemsListCost,
      "/client/items": this.clientItems,
      "/client/items/prices": this.clientItemsPrices,
      "/client/languages": this.clientLanguages,
      "/client/locations": this.clientLocations,
      "/client/mail/dialog/getAllAttachments": this.clientMailDialogGetAllAttachments,
      "/client/mail/dialog/info": this.clientMailDialogInfo,
      "/client/mail/dialog/list": this.clientMailDialogList,
      "/client/mail/dialog/pin": this.clientMailDialogPin,
      "/client/mail/dialog/read": this.clientMailDialogRead,
      "/client/mail/dialog/remove": this.clientMailDialogRemove,
      "/client/mail/dialog/unpin": this.clientMailDialogUnpin,
      "/client/mail/dialog/view": this.clientMailDialogView,
      // "/client/match/available": this.clientMatchAvailable,
      // "/client/match/exit": this.clientMatchExit,
      // "/client/match/group/create": this.clientMatchGroupCreate,
      // "/client/match/group/delete": this.clientMatchGroupDelete,
      // "/client/match/group/exit_from_menu": this.clientMatchGroupExit_From_Menu,
      // "/client/match/group/invite/accept": this.clientMatchGroupInviteAccept,
      // "/client/match/group/invite/cancel": this.clientMatchGroupInviteCancel,
      // "/client/match/group/invite/send": this.clientMatchGroupInviteSend,
      // "/client/match/group/looking/start": this.clientMatchGroupLookingStart,
      // "/client/match/group/looking/stop": this.clientMatchGroupLookingStop,
      // "/client/match/group/start_game": this.clientMatchGroupStart_Game,
      // "/client/match/group/status": this.clientMatchGroupStatus,
      // "/client/match/join": this.clientMatchJoin,
      // "/client/match/offline/start": this.clientMatchOfflineStart,
      // "/client/match/offline/end": this.clientMatchOfflineEnd,
      // "/client/match/updatePing": this.clientMatchUpdatePing,
      // "/client/notifier/channel/create": this.clientNotifierChannelCreate,
      // "/client/profile/status": this.clientProfileStatus,
      "/client/putMetrics": this.clientPutMetrics,
      "/client/quest/list": this.clientQuestList,
      // "/client/ragfair/find": this.clientRagfairFind,
      "/client/ragfair/itemMarketPrice": this.clientRagfairItemMarketPrice,
      "/client/ragfair/search": this.clientRagfairSearch,
      "/client/server/list": this.clientServerList,
      "/client/settings": this.clientSettings,
      "/client/trading/api/getTradersList": this.clientTradingApiGetTradersList,
      "/client/trading/api/traderSettings": this.clientTradingApiTraderSettings,
      // "/client/trading/customization/storage": this.clientTradingCustomizationStorage,
      "/client/weather": this.clientWeather,
      "/launcher/profile/change/email": this.launcherProfileChangeEmail,
      "/launcher/profile/change/password": this.launcherProfileChangePassword,
      "/launcher/profile/change/wipe": this.launcherProfileChangeWipe,
      // "/launcher/profile/get": this.launcherProfileGet,
      // "/launcher/profile/login": this.launcherProfileLogin,
      // "/launcher/profile/register": this.launcherProfileRegister,
      "/launcher/profile/remove": this.launcherProfileRemove,
      "/launcher/server/connect": this.launcherServerConnect,
      "/mode/offline": this.modeOfflinePatches,
      "/mode/offlineNodes": this.modeOfflinePatchNodes,
      "/player/health/events": this.playerHealthEvents,
      "/player/health/sync": this.playerHealthSync,
      "/raid/map/name": this.raidMapName,
      // "/raid/profile/list": this.raidProfileList,
      // "/raid/profile/save": this.raidProfileSave,
      "/server/config/accounts": this.serverConfigAccounts,
      "/server/config/gameplay": this.serverConfigGameplay,
      "/server/config/mods": this.serverConfigMods,
      "/server/config/profiles": this.serverConfigProfiles,
      "/server/config/server": this.serverConfigServer,
      "/server/softreset": this.serverSoftReset,
      // "/singleplayer/bundles": this.singleplayerBundles,
      "/singleplayer/settings/raid/endstate": this.singleplayerSettingsRaidEndstate,
      "/singleplayer/settings/raid/menu": this.singleplayerSettingsRaidMenu,
      //"/singleplayer/settings/bot/difficulty": this.singleplayerSettingsBotDifficulty,
    };
    this.dynamicResponses = {
      "/client/locale": this.dynClientLocale,
      "/client/menu/locale": this.dynClientMenuLocale,
      "/client/location/getLocalloot": this.dynClientLocationGetLocalloot,
      "/client/trading/api/getUserAssortPrice/trader": this.dynClientTradingApiGetUserAssortPriceTrader,
      // "/client/trading/api/getTraderAssort": this.dynClientTradingApiGetTraderAssort,
      "/client/trading/api/getTrader": this.dynClientTradingApiGetTrader,
      // "/client/trading/customization": this.dynClientTradingCustomization,
      "server/profile": this.dynServerProfile,
      "singleplayer/settings/bot/difficulty": this.dynSingleplayerSettingsBotDifficulty,
      "singleplayer/settings/bot/limit": this.dynSingleplayerSettingsBotLimit,
      "singleplayer/settings/defaultRaidSettings": this.dynSingleplayerSettingsDefaultRaidSettings,
      "singleplayer/settings/weapon/durability": this.dynSingleplayerSettingsWeaponDurability,
      // "push/notifier/get": this.dynPushNotifierGet,
      // notifierBase: this.dynNotifierBase,
      // notifierServer: this.dynNotifierServer,
      "api/location": this.dynApiLocation,
      bundle: this.dynBundle,
      jpg: this.dynImageJpg,
      png: this.dynImagePng,
      // last_id: this.dynlast_id,
      
    };
  }
  //dynamic
  dynSingleplayerSettingsBotMaxCap(url, info, sessionID) {
    return "20"; //random response, needs to be handled
  }

  dynApiLocation(url, info, sessionID) {
    // if (url.includes("factory4_day")) { return response_f.noBody(fileIO.readParsed(db.locations_test.factory4_day1).Location); }
    return response_f.getBody(location_f.handler.get(url.replace("/api/location/", ""), sessionID));
  }
  dynClientLocale(url, info, sessionID) {
    const lang = AccountController.getAccountLang(sessionID);
    return response_f.getBody(locale_f.handler.getGlobal(lang, url, sessionID));
  }
  dynClientLocationGetLocalloot(url, info, sessionID) {
    let location_name = "";
    const params = new URL("https://127.0.0.1" + url).searchParams;
    if (typeof info.locationId != "undefined") {
      location_name = info.locationId;
    } else {
      location_name = params.get("locationId");
    }

    return response_f.getBody(location_f.handler.get(location_name));
  }
  dynClientMenuLocale(url, info, sessionID) {
    const lang = AccountController.getAccountLang(sessionID);
    return response_f.getBody(locale_f.handler.getMenu(lang, url, sessionID));
  }
  dynClientTradingApiGetTrader(url, info, sessionID) {
    let TraderID = url.split("/");
    TraderID = TraderID[TraderID.length - 1];
    return response_f.getBody(trader_f.handler.getTrader(TraderID, sessionID));
  }
  dynClientTradingApiGetTraderAssort(url, info, sessionID) {
    let TraderID = url.split("/");
    TraderID = TraderID[TraderID.length - 1];
    keepalive_f.updateTraders(sessionID);
    return response_f.getBody(trader_f.handler.getAssort(sessionID, TraderID));
  }
  dynClientTradingApiGetUserAssortPriceTrader(url, info, sessionID) {
    return response_f.getBody(trader_f.handler.getPurchasesData(url.substr(url.lastIndexOf("/") + 1), sessionID));
  }
  dynClientTradingCustomization(url, info, sessionID) {
    return response_f.getBody(CustomizationController.getCustomization(null, sessionID));
    // let splittedUrl = url.split("/");
    // let traderID = splittedUrl[splittedUrl.length - 2];
    // return response_f.getBody(trader_f.handler.getCustomization(traderID, sessionID));
  }
  dynBundle() {
    return "BUNDLE";
  }
  dynImageJpg() {
    return "IMAGE";
  }
  dynImagePng() {
    return "IMAGE";
  }
  dynlast_id() {
    return "NOTIFY";
  }
  dynNotifierServer() {
    console.log("dynNotifierServer");
    return "NOTIFY";
  }
  dynNotifierBase(url, info, sessionID) {
    console.log("dynNotifierBase");
    return response_f.emptyArrayResponse();
  }
  dynPushNotifierGet(url, info, sessionID) {
    console.log("dynPushNotifierGet");
    return response_f.emptyArrayResponse();
  }
  dynServerProfile(url, info, sessionID) {
    let myID = url.replace("/server/profile/pmc", "").replace("/server/profile/scav", "");
    return response_f.getBody(profile_f.handler.getProfileById(myID));
  }
  dynSingleplayerSettingsBotDifficulty(url, info, sessionID) {
    const splittedUrl = url.split("/");
    const type = splittedUrl[splittedUrl.length - 2].toLowerCase();
    const difficulty = splittedUrl[splittedUrl.length - 1];
    //process.stdout.write(`${type}[${difficulty}] `);
    return response_f.noBody(bots_f.getBotDifficulty(type, difficulty));
  }
  dynSingleplayerSettingsBotLimit(url, info, sessionID) {
    const splittedUrl = url.split("/");
    const type = splittedUrl[splittedUrl.length - 1];
    return response_f.noBody(bots_f.getBotLimit(type));
  }
  dynSingleplayerSettingsDefaultRaidSettings(url, info, sessionID) {
    return response_f.noBody(global._database.gameplay.defaultRaidSettings);
  }
  dynSingleplayerSettingsWeaponDurability(url, info, sessionID) {
    return response_f.noBody(global._database.gameplay.inraid.saveWeaponDurability);
  }

  //static
  clientRepeatableQuestsActivityPeriods(url, info, sessionID) {
    // TODO: requires data from endgame account or at last one that have some of those quests so we can return them here
    // TODO 2: require whole new system to generate the data for repeatable quests, which, where and when 
    return response_f.getBody([]);
  }

  clientAccountCustomization(url, info, sessionID) {
    return response_f.getBody(customization_f.getAccountCustomization());
  }
  clientChatServerList(url, info, sessionID) {
    return response_f.getBody([
      {
        _id: "5ae20a0dcb1c13123084756f",
        RegistrationId: 20,
        DateTime: ~~(new Date() / 1000),
        IsDeveloper: true,
        Regions: ["EUR"],
        VersionId: "bgkidft87ddd",
        Ip: "",
        Port: 0,
        Chats: [{ _id: "0", Members: 0 }],
      },
    ]);
  }
  clientCheckVersion(url, info, sessionID) {
    return response_f.getBody({ isvalid: true, latestVersion: "" });
  }
  clientCustomization(url, info, sessionID) {
    return response_f.getBody(customization_f.getCustomization());
  }
  // clientFriendList(url, info, sessionID) {
  //   return response_f.getBody({ Friends: [], Ignore: [], InIgnoreList: [] });
  // }
  // clientFriendRequestListInbox(url, info, sessionID) {
  //   return response_f.emptyArrayResponse();
  // }
  // clientFriendRequestListOutbox(url, info, sessionID) {
  //   return response_f.emptyArrayResponse();
  // }
  // clientFriendRequestSend(url, info, sessionID) {
  //   return response_f.noBody({
  //     requestId: "¯\\_(ツ)_/¯",
  //     retryAfter: 0,
  //     status: 0,
  //   });
  // }
  clientGameBotGenerate(url, info, sessionID) {
    // bot/generate response format:
    /*     {
          "conditions": [
              {
                  "Role": "assault",
                  "Limit": 16,
                  "Difficulty": "normal"
              },
              {
                  "Role": "assault",
                  "Limit": 14,
                  "Difficulty": "hard"
              },
              {
                  "Role": "assault",
                  "Limit": 7,
                  "Difficulty": "easy"
              },
              {
                  "Role": "bossKilla",
                  "Limit": 1,
                  "Difficulty": "normal"
              }
          ]
      } */


    return response_f.getBody(bots_f.generate(info, sessionID));
  }
  // clientGameConfig(url, info, sessionID) {
  //   /*
  //   public bool queued;
	// public double banTime;
	// public string hash;
	// public string lang;
	// public string aid;
	// public string token;
	// public string taxonomy;
	// public string activeProfileId;
	// public string nickname;
	// public double utc_time;
	// public GClass1009 backend;
	// public long totalInGame;
	// public bool reportAvailable;
  //   */
  //   let obj = {
  //     queued: false,
  //     banTime: 0,
  //     hash: "BAN0",
  //     lang: "en",
  //     aid: sessionID,
  //     token: sessionID,
  //     taxonomy: 6,
  //     activeProfileId: "pmc" + sessionID,
  //     nickname: "user",
  //     utc_time: utility.getTimestamp(),
  //     backend: {
  //       Trading: Server.getHttpsUrl(),// server.getBackendUrl(),
  //       Messaging: Server.getHttpsUrl(),//server.getBackendUrl(),
  //       Main: Server.getHttpsUrl(),//server.getBackendUrl(),
  //       RagFair: Server.getHttpsUrl(),//server.getBackendUrl(),
  //     },
  //     totalInGame: 1000,
  //     reportAvailable: true,
  //   };

  //   // const languages = locale_f.handler.getLanguages().data;
  //   // if(languages !== undefined) {
  //   //   for (let index in languages) {
  //   //     let lang = languages[index];
  //   //     obj.languages[lang.ShortName] = lang.Name;
  //   //   }
  //   // }
  //   // else {
  //   //   obj.languages["en"] = "English";
  //   // }

    

  //   return response_f.getBody(obj);
  // }
  clientGameKeepalive(url, info, sessionID) {
    if (typeof sessionID == "undefined")
      return response_f.getBody({
        msg: "No Session",
        utc_time: utility.getTimestamp(),
      });
    keepalive_f.main(sessionID);
    return response_f.getBody({ msg: "OK", utc_time: utility.getTimestamp() });
  }
  // clientGameLogout(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  clientGameProfileCreate(url, info, sessionID) {
    AccountController.createProfile(info, sessionID);
    // return response_f.getBody({ uid: "pmc" + sessionID });
    return response_f.getBody({ uid: sessionID });
  }
  clientGameProfileItemsMoving(url, info, sessionID) {
    const data = item_f.handler.handleRoutes(info, sessionID);
    AccountController.saveToDisk(sessionID, true);
    return response_f.getBody(data);
  }
  clientGameProfileList(url, info, sessionID) {
    if (!AccountController.isWiped(sessionID) && profile_f.handler.profileAlreadyCreated(sessionID)) {
      health_f.handler.healOverTime(AccountController.getPmcProfile(sessionID), info, sessionID);
    }
    return response_f.getBody(AccountController.getCompleteProfile(sessionID));
  }
  clientGameProfileNicknameChange(url, info, sessionID) {
    const output = profile_f.handler.changeNickname(info, sessionID);

    if (output == "taken") {
      return response_f.getBody(null, 255, serverConfig.translations.alreadyInUse);
    }

    if (output == "tooshort") {
      return response_f.getBody(null, 256, serverConfig.translations.tooShort);
    }

    return response_f.getBody({
      status: 0,
      nicknamechangedate: ~~(new Date() / 1000),
    });
  }
  clientGameProfileNicknameReserved(url, info, sessionID) {
    return response_f.getBody(AccountController.getReservedNickname(sessionID));
  }
  clientGameProfileNicknameValidate(url, info, sessionID) {
    const output = profile_f.handler.validateNickname(info, sessionID);

    if (output == "taken") {
      return response_f.getBody(null, 255, serverConfig.translations.alreadyInUse);
    }

    if (output == "tooshort") {
      return response_f.getBody(null, 256, serverConfig.translations.tooShort);
    }

    return response_f.getBody({ status: "ok" });
  }
  clientGameProfileSavageRegenerate(url, info, sessionID) {
    return response_f.getBody([profile_f.handler.generateScav(sessionID)]);
  }
  clientGameProfileSearch(url, info, sessionID) {
    return response_f.getBody(AccountController.getAllAccounts().filter(x=>x._id != sessionID));
  }
  clientGameProfileSelect(url, info, sessionID) {
    return response_f.getBody({
      status: "ok",
      notifier: {
        server: server.getBackendUrl() + "/",
        channel_id: "testChannel",
        url: "",
        notifierServer: "",
        ws: "",
      },
      notifierServer: "",
    });
  }
  clientGameProfileVoiceChange(url, info, sessionID) {
    profile_f.handler.changeVoice(info, sessionID);
    return response_f.nullResponse();
  }
  clientGameStart(url, info, sessionID) {
    if (AccountController.clientHasProfile(sessionID)) {
      return response_f.getBody({ utc_time: Date.now() / 1000 }, 0, null);
    } else {
      return response_f.getBody({ utc_time: Date.now() / 1000 }, 999, "Profile Not Found!!");
    }
  }
  clientGameVersionValidate(url, info, sessionID) {
    const account = AccountController.find(sessionID);
    if(account !== undefined) {
      logger.logInfo(`User ${sessionID} connected with client version ${info.version.major}`);
    }
    else {
      logger.logInfo("Unknown User connected with client version " + info.version.major);
    }
    return response_f.nullResponse();
  }
  clientGetMetricsConfig(url, info, sessionID) {
    return response_f.getBody(_database.core.matchMetrics);
  }
  clientGlobals(url, info, sessionID) {
    return response_f.getBody(globals_f.getGlobals(url, info, sessionID));
  }
  clientHandbookBuildsMyList(url, info, sessionID) {
    return response_f.getBody(weaponbuilds_f.getUserBuilds(sessionID));
  }
  clientHandbookTemplates(url, info, sessionID) {
    return response_f.getBody(global._database.templates);
  }
  // clientHideoutAreas(url, info, sessionID) {
  //   return response_f.getBody(global._database.hideout.areas);
  // }
  clientHideoutProductionRecipes(url, info, sessionID) {
    return response_f.getBody(global._database.hideout.production);
  }
  clientHideoutProductionScavcaseRecipes(url, info, sessionID) {
    return response_f.getBody(global._database.hideout.scavcase);
  }
  clientHideoutSettings(url, info, sessionID) {
    return response_f.getBody(global._database.hideout.settings);
  }
  clientInsuranceItemsListCost(url, info, sessionID) {
    return response_f.getBody(insurance_f.cost(info, sessionID));
  }
  clientItems(url, info, sessionID) {
    return response_f.getBody(global._database.items);
  }
  clientItemsPrices(url, info, sessionID) {
    return response_f.getBody(global._database.itemPriceTable);
  }
  clientLanguages(url, info, sessionID) {
    return response_f.getBody(locale_f.handler.getLanguages());
  }
  clientLocations(url, info, sessionID) {
    return response_f.getBody(location_f.handler.generateAll());
  }
  clientMailDialogGetAllAttachments(url, info, sessionID) {
    return response_f.getBody(dialogue_f.handler.getAllAttachments(info.dialogId, sessionID));
  }
  clientMailDialogInfo(url, info, sessionID) {
    return response_f.getBody(dialogue_f.handler.getDialogueInfo(info.dialogId, sessionID));
  }
  clientMailDialogList(url, info, sessionID) {
    return dialogue_f.handler.generateDialogueList(sessionID);
  }
  clientMailDialogPin(url, info, sessionID) {
    dialogue_f.handler.setDialoguePin(info.dialogId, true, sessionID);
    return response_f.emptyArrayResponse();
  }
  clientMailDialogRead(url, info, sessionID) {
    dialogue_f.handler.setRead(info.dialogs, sessionID);
    return response_f.emptyArrayResponse();
  }
  clientMailDialogRemove(url, info, sessionID) {
    dialogue_f.handler.removeDialogue(info.dialogId, sessionID);
    return response_f.emptyArrayResponse();
  }
  clientMailDialogUnpin(url, info, sessionID) {
    dialogue_f.handler.setDialoguePin(info.dialogId, false, sessionID);
    return response_f.emptyArrayResponse();
  }
  clientMailDialogView(url, info, sessionID) {
    return dialogue_f.handler.generateDialogueView(info.dialogId, sessionID);
  }
  // clientMatchAvailable(url, info, sessionID) {
  //   // const output = match_f.handler.getEnabled();

  //   // if (output === false) {
  //   //   return response_f.getBody(null, 999, "Offline mode enabled, if you are a server owner please change that in gameplay settings");
  //   // }

  //   // return response_f.getBody(output);
  //   return response_f.getBody(true);
  // }
  // clientMatchExit(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  // clientMatchGroupCreate(url, info, sessionID) {
  //   // return response_f.getBody(match_f.handler.createGroup(sessionID, info));

  // }
  // clientMatchGroupDelete(url, info, sessionID) {
  //   // return response_f.getBody(match_f.handler.createGroup(sessionID, info));
  // }
  // clientMatchGroupExit_From_Menu(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  // clientMatchGroupInviteAccept(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  // clientMatchGroupInviteCancel(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  // clientMatchGroupInviteSend(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  // clientMatchGroupLookingStart(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  // clientMatchGroupLookingStop(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  // clientMatchGroupStart_Game(url, info, sessionID) {
  //   return response_f.getBody(match_f.handler.joinMatch(info, sessionID));
  // }
  // clientMatchGroupStatus(url, info, sessionID) {
  //   return response_f.getBody(match_f.handler.getGroupStatus(info));
  // }
  // clientMatchJoin(url, info, sessionID) {
  //   return response_f.getBody(match_f.handler.joinMatch(info, sessionID));
  // }
  clientMatchOfflineStart(url, info, sessionID) {

    //how offline/start request is formatted
    /*     {
          "locationName": "Interchange",
          "entryPoint": "MallNW",
          "startTime": 1649941648.0,
          "dateTime": "CURR",
          "gameSettings": {
              "timeAndWeatherSettings": {
                  "isRandomTime": false,
                  "isRandomWeather": false
              },
              "botsSettings": {
                  "isEnabled": true,
                  "isScavWars": false,
                  "botAmount": "AsOnline"
              },
              "wavesSettings": {
                  "botDifficulty": "AsOnline",
                  "isBosses": true,
                  "isTaggedAndCursed": false,
                  "wavesBotAmount": "AsOnline"
              }
          }
      } */

    offraid_f.handler.addPlayer(sessionID, {
      Location: info.locationName,
      Time: info.dateTime,
    });
    return response_f.getBody(null);
  }
  // clientMatchOfflineEnd(url, info, sessionID) {
  //   return response_f.getBody(null);
  // }
  // clientMatchUpdatePing(url, info, sessionID) {
  //   return response_f.nullResponse();
  // }
  // clientNotifierChannelCreate(url, info, sessionID) {
  //   return response_f.getBody({
  //     notifier: {
  //       server: `${server.getBackendUrl()}/`,
  //       channel_id: "testChannel",
  //       url: `${server.getBackendUrl()}/notifierServer/get/${sessionID}`,
  //     },
  //     notifierServer: `${server.getBackendUrl()}/notifierServer/get/${sessionID}`,
  //   });
  // }
  // clientProfileStatus(url, info, sessionID) {
  //   return response_f.getBody({
  //       maxPveCountExceeded: false,
  //       profiles:[
  //       {
  //         profileid: "scav" + sessionID,
  //         profileToken: null,
  //         status: "Free",
  //         sid: "",
  //         ip: "",
  //         port: 0,
  //       },
  //       {
  //         profileid: "pmc" + sessionID,
  //         profileToken: null,
  //         status: "Free",
  //         sid: "",
  //         ip: "",
  //         port: 0,
  //       }]
  //     });
  // }
  clientPutMetrics(url, info, sessionID) {
    return response_f.nullResponse();
  }
  clientQuestList(url, info, sessionID) {
    return response_f.getBody(quest_f.getQuestsForPlayer(url, info, sessionID));
  }
  // clientRagfairFind(url, info, sessionID) {
  //   return response_f.nullResponse();
  //   // return response_f.getBody(ragfair_f.getOffers(sessionID, info));
  // }
  clientRagfairItemMarketPrice(url, info, sessionID) {
    return response_f.getBody(ragfair_f.getRagfairMarketPrice(info));
  }
  clientRagfairSearch(url, info, sessionID) {
    return response_f.getBody(ragfair_f.getOffers(sessionID, info));
  }
  clientServerList(url, info, sessionID) {
    return response_f.getBody([{ip:"23.106.37.100",port:0}]);
  }
  clientSettings(url, info, sessionID) {
    return response_f.getBody(fileIO.readParsed("./db/base/client.settings.json"));
  }
  clientTradingApiGetTradersList(url, info, sessionID) {
    return response_f.getBody(trader_f.handler.getAllTraders(sessionID));
  }
  clientTradingApiTraderSettings(url, info, sessionID) {
    return response_f.getBody(trader_f.handler.getAllTraders(sessionID));
  }
  // clientTradingCustomizationStorage(url, info, sessionID) {
  //   // return fileIO.read(customization_f.getPath(sessionID));
  //   return CustomizationController.getCustomizationStorage();
  // }
  clientWeather(url, info, sessionID) {
    return response_f.getBody(weather_f.generate());
  }

  launcherProfileChangeEmail(url, info, sessionID) {
    let output = AccountController.changeEmail(info);
    return output === "" ? "FAILED" : "OK";
  }
  launcherProfileChangePassword(url, info, sessionID) {
    let output = AccountController.changePassword(info);
    return output === "" ? "FAILED" : "OK";
  }
  launcherProfileChangeWipe(url, info, sessionID) {
    let output = AccountController.wipe(info);
    return output === "" ? "FAILED" : "OK";
  }
  // launcherProfileGet(url, info, sessionID) {
  //   let accountId = AccountController.login(info);
  //   let output = AccountController.find(accountId);
  //   output['server'] = server.name;
  //   return fileIO.stringify(output);
  // }
  // launcherProfileLogin(url, info, sessionID) {
  //   // let output = AccountController.login(info);
  //   let output = AccountController.login(info);
  //   return output === undefined || output === null || output === "" ? "FAILED" : output;
  // }
  // launcherProfileRegister(url, info, sessionID) {
  //   let output = AccountController.register(info);
  //   return output === undefined || output === null || output === "" ? "FAILED" : output;
  // }
  launcherProfileRemove(url, info, sessionID) {
    let output = AccountController.remove(info);
    return output === undefined || output === null || output === "" ? "FAILED" : "OK";
  }
  launcherServerConnect(url, info, sessionID) {
    return fileIO.stringify({
      backendUrl: server.getBackendUrl(),
      name: server.getName(),
      editions: Object.keys(db.profile).filter((key) => {
        return db.profile[key] instanceof Object;
      }),
    });
  }

  modeOfflinePatches(url, info, sessionID) {
    return response_f.noBody(serverConfig.Patches);
  }
  modeOfflinePatchNodes(url, info, sessionID) {
    return response_f.noBody(serverConfig.PatchNodes);
  }
  playerHealthEvents(url, info, sessionID) {
    health_f.handler.updateHealth(info, sessionID);
    return response_f.nullResponse();
  }
  playerHealthSync(url, info, sessionID) {
    const pmcData = AccountController.getPmcProfile(sessionID);
    health_f.handler.saveHealth(pmcData, info, sessionID);
    return response_f.nullResponse();
  }
  raidMapName(url, info, sessionID) {
    return offraid_f.handler.addPlayer(sessionID, info);
  }
  serverConfigAccounts(url, body, sessionID) {
    home_f.processSaveAccountsData(body, db.user.configs.accounts);
    return home_f.RenderAccountsConfigPage("/server/config/accounts");
  }
  serverConfigGameplay(url, body, sessionID) {
    //execute data save here with info cause info should be $_GET transfered to json type with info[variableName]
    home_f.processSaveData(body, global._database.gameplay);
    return home_f.RenderGameplayConfigPage("/server/config/gameplay");
  }
  serverConfigMods(url, body, sessionID) {
    home_f.processSaveModData(body, global.internal.resolve("user/configs/mods.json"));
    return home_f.RenderModsConfigPage("/server/config/mods");
  }
  serverConfigProfiles(url, body, sessionID) {
    return home_f.renderPage();
  }
  serverConfigServer(url, body, sessionID) {
    home_f.processSaveServerData(body, db.user.configs.server);
    return home_f.RenderServerConfigPage("/server/config/server");
  }
  serverSoftReset(url, body, sessionID) {
    global.server.softRestart();
    return { status: "OK" };
  }
  singleplayerBundles(url, info, sessionID) {
    const local = serverConfig.ip === "127.0.0.1";
    return response_f.noBody(bundles_f.handler.getBundles(local));
  }
  singleplayerSettingsRaidEndstate(url, info, sessionID) {
    return response_f.noBody(global._database.gameplay.inraid.miaOnTimerEnd);
  }
  singleplayerSettingsRaidMenu(url, info, sessionID) {
    return response_f.noBody(global._database.gameplay.defaultRaidSettings);
  }
}
module.exports.responses = new Responses();