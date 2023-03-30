const { FriendshipController } = require('./FriendshipController');
const { AccountController } = require('./AccountController');
const { BotController } = require('./BotController');
const { ConfigController } = require('./ConfigController');
const utility = require('./../../core/util/utility');
const { TradingController } = require('./TradingController');
const { DatabaseController } = require('./DatabaseController');
const { ItemController } = require('./ItemController');
const { InsuranceController } = require('./InsuranceController');
const { logger } = require('../../core/util/logger');
const { responses } = require('./../functions/response');
const { CustomizationController } = require('./CustomizationController');
const { QuestController } = require('./QuestController');
const { LootController } = require('./LootController');


/**
 * The response controller is the controller that handles all HTTP request and responses
 * This controller can be overriden by Mods
 */
class ResponseController
{
    constructor() {
        // console.log("ResponseController");
    }
    static SessionIdToIpMap = {};
    static getUrl()
    {
        ConfigController.rebuildFromBaseConfigs();
        var ip = ConfigController.Configs["server"].ip;
        var port = ConfigController.Configs["server"].port;
        return `${ip}:${port}`;
    }

    static getBackendUrl()
    {
        ConfigController.rebuildFromBaseConfigs();
        var ip = ConfigController.Configs["server"].ip_backend;
        var port = ConfigController.Configs["server"].port;
        return `https://${ip}:${port}`;
    }

    static getWebSocketUrl()
    {
        const wss = global.WebSocketServer;
        return `ws://${ResponseController.getWebSocketUrlWithoutWs()}`;
        // ConfigController.rebuildFromBaseConfigs();
        // var ws = ResponseController.getBackendUrl().replace("https", "wss");
        // // console.log("getWebSocketUrl:" + ws)
        // return ws;
    }

    static getWebSocketUrlWithoutWs()
    {
        const wss = global.WebSocketServer;
        return `${wss.address().address}:${wss.address().port}`;
        // ConfigController.rebuildFromBaseConfigs();
        // var ws = ResponseController.getBackendUrl().replace("https", "wss");
        // // console.log("getWebSocketUrl:" + ws)
        // return ws;
    }

  static getMainUrl() {
    ConfigController.rebuildFromBaseConfigs();
    var ip = ConfigController.Configs["server"].serverIPs.Main;
    return `${ip}`;
  }

  static getTradingUrl() {
    ConfigController.rebuildFromBaseConfigs();
    var ip = ConfigController.Configs["server"].serverIPs.Trading;
    return `${ip}`;
  }

  static getRagfairUrl() {
    ConfigController.rebuildFromBaseConfigs();
    var ip = ConfigController.Configs["server"].serverIPs.Ragfair;
    return `${ip}`;
  }

  static getMessagingUrl() {
    ConfigController.rebuildFromBaseConfigs();
    var ip = ConfigController.Configs["server"].serverIPs.Messaging;
    return `${ip}`;
  }

  static getPort() {
      ConfigController.rebuildFromBaseConfigs();
      var port = ConfigController.Configs["server"].port;
      return port;
  }

  static getHttpsUrl = () => `https://${ResponseController.getUrl()}`;

    // noBody
    static noBody = (data) => {
        // return utility.clearString(fileIO.stringify(data));
        return JSON.stringify(data);
    }
    // getBody
    static getBody = (data, err = 0, errmsg = null) => {
        return fileIO.stringify({ "err": err, "errmsg": errmsg, "data": data }, true);
    }
    // getUnclearedBody
    static  getUnclearedBody = (data, err = 0, errmsg = null) => {
        return fileIO.stringify({ "err": err, "errmsg": errmsg, "data": data });
    }
    // nullResponse
    static nullResponse = () => {
        return ResponseController.getBody(null);
    }
    /**
     * emptyArrayResponse
     * @returns {Object} empty Body Array
     */
    static emptyArrayResponse = () => {
        return this.getBody([]);
    }

    /**
     * A method that is called whenever any request is made to the Server
     * @param {HttpRequest} req 
     */
    static receivedCall = (req, sessionID) => {
        InsuranceController.checkExpiredInsurance();
        TradingController.checkAIBuyItemsOnFleaMarket();

        const ip = req.header('x-forwarded-for') || req.socket.remoteAddress;
        const port = req.socket.remotePort || req.socket.localPort;
        // ResponseController.SessionIdToIpMap[sessionID] = `${ip}:${port}`;
        ResponseController.SessionIdToIpMap[sessionID] = `${ip}`;
        AccountController.saveToDisk(sessionID);
    }

    static getNotifier = (sessionID) => {
        // return {
        //     server: ResponseController.getBackendUrl(), // this.httpServerHelper.buildUrl(),
        //     channel_id: sessionID,
        //     url: `${ResponseController.getBackendUrl()}/notifierServer/get/${sessionID}`,
        //     notifierServer: `${ResponseController.getBackendUrl()}/notifierServer/get/${sessionID}`,
        //     ws: `${ResponseController.getWebSocketUrl()}/notifierServer/getwebsocket/${sessionID}`
        // }
        global.WebSocketServer.NextChannelId = sessionID;
        return {
            server: ResponseController.getBackendUrl(), // this.httpServerHelper.buildUrl(),
            channel_id: sessionID,
            // url: `notifierServer/${sessionID}`, // url can be empty if we are using Web Sockets
            ws: `${ResponseController.getWebSocketUrlWithoutWs()}`
        }
    }

    /**
     * Routes
     */
    static Routes = 
    [
        {
            url: "/client/game/profile/select",
            action: (url, info, sessionID) => {
                return ResponseController.getBody({
                    "status": "ok",
                });
            }
        },
        {
            url: "/launcher/profile/register",
            action: (url, info, sessionID) => {
                let output = AccountController.register(info);
                return output === undefined || output === null || output === "" ? "FAILED" : output;
            }
            
        },
      
    {
     url: "/client/game/config", action: (url, info, sessionID) => {

        var mainUrl = ResponseController.getBackendUrl();
        var enableIndividualIps = ConfigController.Configs["server"].serverIPs.Enable;
        
        let profileId = sessionID;
        let pmcData = AccountController.getPmcProfile(sessionID);
        if(pmcData) {
            profileId = pmcData._id;
        }


        let obj = {
            queued: false,
            banTime: 0,
            hash: "BAN0",
            lang: "en",
            aid: sessionID,
            token: sessionID,
            taxonomy: 6,
            // activeProfileId: "pmc" + sessionID,
            activeProfileId: profileId,
            nickname: "user",
            utc_time: utility.getTimestamp(),
            backend: {
              Trading: enableIndividualIps === true ? ResponseController.getTradingUrl() : mainUrl,// server.getBackendUrl(),
              Messaging: enableIndividualIps === true ? ResponseController.getMessagingUrl() : mainUrl,// server.getBackendUrl(),
              Main: enableIndividualIps === true ? ResponseController.getMainUrl() : mainUrl,// server.getBackendUrl(),
              RagFair: enableIndividualIps === true ? ResponseController.getRagfairUrl() : mainUrl,// server.getBackendUrl(),
            },
            totalInGame: 1000,
            reportAvailable: false,
          };
          return ResponseController.getBody(obj);
    }
},
{
url: "/client/profile/status",
action: (url, info, sessionID) => {

    let profileId = sessionID;
    let scavProfileId = sessionID;
    let pmcData = AccountController.getPmcProfile(sessionID);
    if(pmcData) {
        profileId = pmcData._id;
        scavProfileId = pmcData.savage;
    }

    const ip = ResponseController.SessionIdToIpMap[sessionID];


      return ResponseController.getBody({
          maxPveCountExceeded: false,
          profiles:[
          {
            // profileid: "scav" + sessionID,
            profileid: scavProfileId,
            profileToken: null,
            status: "Free",
            sid: sessionID,
            ip: ip ?? "",
            port: 0,
          },
          {
            // profileid: "pmc" + sessionID,
            profileid: profileId,
            profileToken: null,
            status: "Free",
            sid: sessionID,
            ip: ip ?? "",
            port: 0,
          }]
        });
    }
},
{
url: "/launcher/profile/login",
action: (url, info, sessionID) => {
    // let output = AccountController.login(info);
    let output = AccountController.login(info);
    return output === undefined || output === null || output === "" ? "FAILED" : output;
  }
},
{
    url: "/launcher/profile/get",
    action: (url, info, sessionID) => {
        let accountId = AccountController.login(info);
        let output = AccountController.find(accountId);
        // output['server'] = server.name;
        output['server'] = "CUNT";
        return fileIO.stringify(output);
      }
},
{
    url: "/client/game/logout",
    action: (url, info, sessionID) => {
        const account = AccountController.find(sessionID);
        account.wipe = false;
        AccountController.saveToDisk(sessionID, true, true);
    }
},
{
    url: "/singleplayer/airdrop/config",
    action: (url, info, sessionID) => {
        const airdropSettings = ConfigController.Configs["gameplay"].inRaid.airdropSettings;
        // return JSON.stringify(
      
        return JSON.stringify(airdropSettings);
    }
},
{
    url: "/client/location/getAirdropLoot",
    action: (url, info, sessionID) => {
        const result = LootController.GenerateAirdropLootListForAkiAirdrop()
      
        return JSON.stringify(result);
    }
},
/**
 * This is called by the Client mod whenever a person is killed
 * At time of writing. "info" contains
 * {
 *  diedAID (accoundId of the person who died), 
 *  diedFaction (Faction Savage/Bear/Usec etc of the person who died), 
 *  diedWST (Spawn type assault/pmcBot etc of the person who died), 
 *  killedByAID (accoundId of the person who killed the person), 
 * }
 */
{
    url: "/client/raid/person/killed",
    /**
     * 
     * @param {*} url not used here
     * @param {*} info { diedAID (accoundId of the person who died), 
   diedFaction (Faction Savage/Bear/Usec etc of the person who died), 
   diedWST (Spawn type assault/pmcBot etc of the person who died), 
   killedByAID (accoundId of the person who killed the person), 
  }
     * @param {*} sessionID client AccountId that called this route
     * @returns {string} stringified message
     */
    action: (url, info, sessionID) => {
        console.log(info);

        const fenceConfig = ConfigController.Configs["gameplay"].fence;
        const killScavChange = fenceConfig.killingScavsFenceLevelChange;
        const killPmcChange = fenceConfig.killingPMCsFenceLevelChange;

        // if the killer is the player
        if(info.killedByAID === sessionID) {
            const account = AccountController.find(sessionID);
            const profile = AccountController.getPmcProfile(sessionID);
            
            if(info.diedFaction === "Savage" || info.diedFaction === "Scav")
                profile.TradersInfo[TradingController.FenceId].standing += killScavChange; 
            else if(info.diedFaction === "Usec" || info.diedFaction === "Bear")
                profile.TradersInfo[TradingController.FenceId].standing += killPmcChange; 

            profile_f.handler.saveToDisk(sessionID);
        }

        return JSON.stringify(
            {
            }
        )
    }
},
/**
 * This is called by the Client mod to know whether to display the killed message
 */
 {
    url: "/client/raid/person/killed/showMessage",
    action: (url, info, sessionID) => {
        const showMessage = ConfigController.Configs["gameplay"].inRaid.showDeathMessage;
        if(showMessage !== undefined)
            return JSON.stringify(showMessage);
        else
            return JSON.stringify(false);
    }
},
{
    url: "/client/raid/createFriendlyAI",
    action: (url, info, sessionID) => {

        const createFriendlies = ConfigController.Configs["gameplay"].inRaid.createFriendlyAI;
        if(createFriendlies !== undefined)
            return JSON.stringify(createFriendlies);
        else
            return JSON.stringify(false);

    }
},
{
    url: "/client/raid/bots/getNewProfile",
    action: (url, info, sessionID) => {
        return JSON.stringify(BotController.GetNewBotProfile(info, sessionID));
    }
}
,
{
    url: "/client/raid/person/lootingContainer",
    action: (url, info, sessionID) => {
        console.log(info);

        return JSON.stringify("");
    }
},
// { url: "/client/game/profile/select", action: (url, info, sessionID) => {
//     return ResponseController.getBody({
//         "status": "ok",
//         // "notifier": NotifierService.getChannel(sessionID),
//         // "notifierServer": NotifierService.getServer(sessionID)
//     });
// }
// },
// { url: "/client/friend/list", action: (url, info, sessionID) => {

//     var result = { Friends: [], Ignore: [], InIgnoreList: [] };
//     result.Friends = FriendshipController.getFriends(sessionID);
//     // console.log(result);
//     return ResponseController.getBody(result);
   
// }
// },
{ url: "/client/game/profile/search", action:(url, info, sessionID) => {
    return ResponseController.getBody(AccountController.getAllAccounts().filter(x=>x._id != sessionID));
}
},

/**
 * 
 * @param {string} url 
 * @param {object} info 
 * @param {string} sessionID 
 * @returns {object} 
 */
 { url: "/client/notifier/channel/create", action: (url, info, sessionID) => {
    return ResponseController.getBody(ResponseController.getNotifier(sessionID));
    // return JSON.stringify(ResponseController.getNotifier(sessionID));
}
 },
{
    url:
    "/client/game/profile/search", action: (url, data, sessionID) => {

        if(sessionID === undefined) {
            throw "SESSION ID is not defined!";
        }

        if(data === undefined) {
            throw "data is not defined!";
        }

        if(data.nickname === undefined) {
            throw "nickname is not defined!";
        }

        const foundAccounts = AccountController
        .getAllAccounts()
        .filter(x=>x._id != sessionID 
            && x.Info.Nickname.toLowerCase().indexOf(data.nickname.toLowerCase()) !== -1
            );

        return response_f.getBody(foundAccounts);
    }
},
{
    url: "/raid/profile/save",
    action: (url, info, sessionID) => {
        offraid_f.saveProgress(info, sessionID);
        AccountController.saveToDisk(sessionID);
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/match/group/create",
    action: (url, info, sessionID) => {
        logger.logError("Cannot create group while in Singleplayer!");
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/match/group/leave",
    action: (url, info, sessionID) => {
        logger.logError("Cannot leave group while in Singleplayer!");
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/match/group/delete",
    action: (url, info, sessionID) => {
        logger.logError("Cannot delete group while in Singleplayer!");
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/match/group/exit_from_menu",
    action: (url, info, sessionID) => {
        logger.logError("Cannot leave group while in Singleplayer!");
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/match/group/invite/send",
    action: (url, info, sessionID) => {
        logger.logError("Cannot send invites while in Singleplayer!");
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/match/group/invite/cancel",
    action: (url, info, sessionID) => {
        logger.logError("Cannot cancel invites while in Singleplayer!");
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/match/group/invite/accept",
    action: (url, info, sessionID) => {
        logger.logError("Cannot accept invites while in Singleplayer!");
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/match/group/status",
    action: (url, info, sessionID) => {
        logger.logError("Cannot search for friends while in Singleplayer!");
        return ResponseController.getBody({"players": []});
    }
},
{
    url: "/ServerInternalIPAddress",
    action: (url, info, sessionID) => {
        const internalIp =ConfigController.Configs["server"].ip;
        // return JSON.stringify(internalIp);
        return internalIp;
    }
},
{
    url: "/ServerExternalIPAddress",
    action: (url, info, sessionID) => {
        const externalIP =ConfigController.Configs["server"].ip_backend;
        return JSON.stringify(externalIP);
    }
},
{
    url: "/getBundleList",
    action: (url, info, sessionID) => {
        return ResponseController.noBody(bundles_f.handler.getBundles(false));
    }
},
{
    url: "/client/match/offline/start",
    action: (url, info, sessionID) => {
        console.log(info);
        offraid_f.handler.addPlayer(sessionID, {
            Location: info.locationName,
            Time: info.dateTime,
        });
        return ResponseController.getBody(null);
    }
},
{
    url: "/client/match/offline/end",
    action: (url, info, sessionID) => {
        console.log(info);
        return ResponseController.getBody(null);
    }
},
{
    url: "/raid/profile/list",
    action: (url, info, sessionID) => {
        // return ResponseController.getBody(match_f.handler.getProfile(info));
        return ResponseController.nullResponse();
    }
},
{
    url: "/client/trading/customization/storage",
    action: (url, info, sessionID) => {
        // return fileIO.read(customization_f.getPath(sessionID));
        // return ResponseController.getBody(CustomizationController.getCustomizationStorage(sessionID));
        return CustomizationController.getCustomizationStorage(sessionID);
      }
}
    ]

    static DynamicRoutes = [

        {
            url: "/client/trading/customization/",
            action: (url, info, sessionID) => {
                console.log("/client/trading/customization/");

                return ResponseController.getBody(CustomizationController.getCustomization(null, sessionID));
            }
        },
        {
            url: "/client/trading/api/getTraderAssort/",
            action: (url, info, sessionID) => {
                let traderID = url.split("/");
                traderID = traderID[traderID.length - 1];
                return ResponseController.getBody(TradingController.getTraderAssortFilteredByLevel(traderID, sessionID));
            }
        },

        // {
        //     url:"/client/location/getLocalloot",
        //     action: (url, info, sessionID) => {
        //         let location_name = "";
        //         const params = new URL("https://127.0.0.1" + url).searchParams;
        //         if (typeof info.locationId != "undefined") {
        //         location_name = info.locationId;
        //         } else {
        //         location_name = params.get("locationId");
        //         }

        //         return response_f.getBody(location_f.handler.get(location_name));
        //     }
        // }
    ]

    static getRoute = (url,info,sessionID) => {
        var foundRoute = ResponseController.Routes.find(y=>y.url === url);
        if(foundRoute !== undefined) {
            return foundRoute.action;
        }
        
        return undefined;
    }

    /**
     * Add a new route to the Response Controller. If route already exists, do nothing
     * @param {string} in_url 
     * @param {function} in_action 
     */
    static addRoute = (in_url, in_action) => {
        var existingRoute = ResponseController.Routes.find(x=>x.url == in_url);
        if(existingRoute === undefined) {
            // console.log("adding route " + in_url);
            ResponseController.Routes.push({ url: in_url, action: in_action });
        }
        else {
            logger.logError(`ResponseController already has a route of the url: ${in_url}`);
            throw `ResponseController already has a route of the url: ${in_url}`;
        }
    }

    /**
     * Adds an Array of Routes to the ResponseController
     * @param {*} listOfRoutes 
     */
    static addRoutes = (listOfRoutes) => {
        for(const item of listOfRoutes) {
            ResponseController.addRoute(item.url, item.action);
        }
    }

    /**
     * Override a route in the Response Controller, if the route doesn't exist, add the route
     * @param {*} url 
     * @param {*} action 
     */
    static overrideRoute = (url, action) => {
        var existingRouteStatic = ResponseController.Routes.find(x=>x.url == url);
        var existingRouteDynamic = ResponseController.DynamicRoutes.find(x=>x.url == url);
        if(existingRouteStatic !== undefined)
            existingRouteStatic.action = action;
        else if(existingRouteDynamic !== undefined)
            existingRouteDynamic.action = action;
        else if(responses.staticResponses[url] !== undefined)
            responses.staticResponses[url] = action;
        else if(responses.dynamicResponses[url] !== undefined)
            responses.dynamicResponses[url] = action;
        else 
            ResponseController.addRoute(url, action);
    }

    static RoutesToNotLog = [
        "/jpg"
    ];

};


/**
 * Responses for Db Viewer
 */
class ResponseDbViewer {

    constructor() {
        // Items ----------------
        ResponseController.addRoute(`/db/getItemInfo`, (url, info, sessionID) => { 
            const qsParams = utility.getQueryStringParameters(url);
            var listOfItems = ItemController.getDatabaseItems();
            return JSON.stringify(listOfItems(qsParams.itemId)); 

        });
        ResponseController.addRoute(`/db/searchItemsByName/`, (url, info, sessionID) => { 
            if (info.searchParams !== undefined) {
                for(const itemId in listOfItems) {
                };
                return JSON.stringify(listOfItems); 
            }
            return JSON.stringify(null); 
        });

        // Traders ----------------
        var listOfTraders = TradingController.getAllTraders();
        ResponseController.addRoute(`/db/getTraders/`, (url, info, sessionID) => { 
            // always get the database current list of traders, so recall getAllTraders here
            return JSON.stringify(TradingController.getAllTraders()); 
        });
        for(const t of listOfTraders) {
            ResponseController.addRoute(`/db/getTraderInfo/${t.base._id}`, (url, info, sessionID) => { 
                return JSON.stringify(TradingController.getTrader(t.base._id)); 
            });
            ResponseController.addRoute(`/db/getTradingAssort/${t.base._id}`, (url, info, sessionID) => { 
                const assort = TradingController.getTraderAssort(t.base._id);
                assort.items.forEach(element => {
                    element["itemInfo"] = ItemController.getDatabaseItems()[element._tpl];
                });
                return JSON.stringify(assort); 
            });
        };
        ResponseController.addRoute(`/db/getTraderInfo`, (url, info, sessionID) => { 
            const qsParams = utility.getQueryStringParameters(url);

            return JSON.stringify(TradingController.getTrader(qsParams.tid)); 

        });
        ResponseController.addRoute(`/db/getTradingAssort`, (url, info, sessionID) => { 
            const qsParams = utility.getQueryStringParameters(url);

            const assort = TradingController.getTraderAssort(qsParams.tid);
            assort.items.forEach(element => {
                element["itemInfo"] = ItemController.getDatabaseItems()[element._tpl];
            });
            return JSON.stringify(assort); 
        });

        // Users ----------------
        // var listOfTraders = TradingController.getAllTraders();
        // for(const t of listOfTraders) {
        //     ResponseController.addRoute(`/db/getTraderInfo/${t.base._id}`, (url, info, sessionID) => { return JSON.stringify(t); })
        //     ResponseController.addRoute(`/db/getTradingAssort/${t.base._id}`, (url, info, sessionID) => { return JSON.stringify(t.assort); })
        // };
    }
}

module.exports.ResponseController = ResponseController;
module.exports.Routes = {}

// Hacked in responses
module.exports.ResponseDbViewer = new ResponseDbViewer();
// create routes for dbViewer
// (function() {
//     
// })();

const RagfairRoutes = [
    {
        url: "/client/ragfair/find",
        action: (url, info, sessionID) => {
            return ResponseController.getBody(ragfair_f.getOffers(sessionID, info));
        }
    },
    {
        url: "/client/ragfair/itemMarketPrice",
        action: (url, info, sessionID) => {
            return ResponseController.getBody(TradingController.getRagfairMarketPrice(info));
        }
    }
]

const HideoutRoutes = [
    {
        url: "/client/hideout/areas",
        action: (url, info, sessionID) => {
            return ResponseController.getBody(DatabaseController.getDatabase().hideout.areas);
        }
    }
    
]

const QuestRoutes = [
    {
        url: "/client/repeatalbeQuests/activityPeriods",
        action: (url, info, sessionID) => {
            return ResponseController.getBody(QuestController.getRepeatableQuests(info, sessionID));
        }
    }
    
]

const SITRoutes = [
    {
        url: "/client/sit-validator",
        action: (url, info, sessionID) => {
            return JSON.stringify(true);
        }
    },
    {
        url: "/client/WebSocketAddress",
        action: (url, info, sessionID) => {
            // const wss = global.WebSocketServer;
            // return JSON.stringify(`ws://${wss.address().address}:${wss.address().port}`);
            return ResponseController.getWebSocketUrl();
        }
    }
    
]

const FriendshipRoutes = [
    { 
        url: "/client/friend/list", action: (url, info, sessionID) => {

            var result = { Friends: [], Ignore: [], InIgnoreList: [] };
            result.Friends = FriendshipController.getFriends(sessionID);
            return ResponseController.getBody(result);
       
        }
    },
    {
        url: "/client/friend/request/decline",
        action: (url, info, sessionID) => {

            const myAccount = AccountController.find(sessionID);
            FriendshipController.deleteFriendRequest(sessionID, info.request_id);

            return ResponseController.nullResponse();
        }
    },
    /**
     * Expects requestId, retryAfter, status
     * @param {*} url 
     * @param {*} info 
     * @param {*} sessionID 
     * @returns {*} { requestId, retryAfter, status }
     */
    { 
        url: "/client/friend/request/send", action:(url, info, sessionID) => {
            const result = FriendshipController.addFriendRequest(sessionID, info.to);
            return ResponseController.getBody(result);
        }
    },
    { 
        url: "/client/friend/request/list/outbox", action: (url, info, sessionID) => {
            const result = FriendshipController.getFriendRequestOutbox(sessionID);
            return ResponseController.getBody(result);

        }
    },
    { 
        url: "/client/friend/request/list/inbox", action:(url, info, sessionID) => {
            const result = FriendshipController.getFriendRequestInbox(sessionID);
            return ResponseController.getBody(result);
        }
    },
    /**
     * Expects requestId, retryAfter, status
     * @param {*} url 
     * @param {*} info 
     * @param {*} sessionID 
     * @returns {*} { requestId, retryAfter, status }
     */
    { 
        url: "/client/friend/request/cancel", action:(url, info, sessionID) => {
            const result = FriendshipController.deleteFriendRequest(sessionID, info.requestId);
            return ResponseController.getBody(result);
        }
    },
    /**
     * Expects requestId, retryAfter, status
     * @param {string} url 
     * @param {object} info 
     * @param {string} sessionID 
     * @returns {object} { requestId, retryAfter, status }
     */
    { 
        url: "/client/friend/request/accept", action:(url, info, sessionID) => {
            FriendshipController.acceptAllRequests(sessionID);
            return ResponseController.getBody("OK");
        }
    },
    /**
     * Expects requestId, retryAfter, status
     * @param {string} url 
     * @param {object} info 
     * @param {string} sessionID 
     * @returns {object} { requestId, retryAfter, status }
     */
    { 
        url: "/client/friend/request/accept-all", action:(url, info, sessionID) => {
            FriendshipController.acceptAllRequests(sessionID);
            return ResponseController.getBody("OK");
        }
    },
    
]

ResponseController.addRoutes(FriendshipRoutes);
ResponseController.addRoutes(HideoutRoutes);
ResponseController.addRoutes(QuestRoutes);
ResponseController.addRoutes(RagfairRoutes);
ResponseController.addRoutes(SITRoutes);