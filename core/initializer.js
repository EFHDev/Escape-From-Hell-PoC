const fs = require('fs');
const { AccountController } = require('../src/Controllers/AccountController');
const { ConfigController } = require('../src/Controllers/ConfigController');
const { DatabaseController } = require('../src/Controllers/DatabaseController');
const chalk = require('chalk');
const config = require("../user/configs/server_base.json")
const downloadReleaseTag = require('./update');

class Initializer {
  constructor() {
    this.init();
  }

  async init() {
    //if (config.AutoUpdateEFH === true) {
      //console.log(chalk.red.bold(" [EFH] Auto-Update will clear any changes you make to your servers Database (I.E changing boss spawns or changing max ammo stacks, that isnt done through a mod, Please, if you dont want this, turn this off. "));
      //try {
        //await downloadReleaseTag('EFHDev', 'Escape-From-Hell-PoC', 'Server', 'Server');
      //} catch (error) {
      //  console.log("Either the download of the latest update failed, or there is no new update. lol");
     // }
   // }
    this.initializeCore();
    this.initializeExceptions();
    this.initializeClasses();
    this.initializeItemRoute();
    // this.initializeCacheCallbacks();

    global.consoleResponse = require("./console.js").consoleResponse;
    // server.start();

    // -------------------------------------------------------
    // Loads all Accounts and Profiles into the Memory Store
    AccountController.getAllAccounts();
  }
  /* load core functionality */
  initializeCore() {


    if (!fs.existsSync(process.cwd() + "/user/"))
      fs.mkdirSync(process.cwd() + "/user/");

    if (!fs.existsSync(process.cwd() + "/user/mods/"))
      fs.mkdirSync(process.cwd() + "/user/mods/");

    // -------------------------------------------------------
    // Initialization of globals
    if (global.internal === undefined)
      global.internal = {};
    if (global.core === undefined)
      global.core = {};
    if (global.db === undefined)
      global.db = {};
    if (global.res === undefined)
      global.res = {};
    if (global._database === undefined)
      global._database = {};
    if (global.cache === undefined)
      global.cache = {};

    global.startTimestamp = new Date().getTime();

    // -------------------------------------------------------
    // NOTE/TODO: This needs to be removed!
    //
    global.internal.fs = require("fs");
    global.internal.path = require("path");
    global.internal.util = require("util");
    global.internal.resolve = global.internal.path.resolve;
    global.internal.zlib = require("zlib");
    global.internal.https = require("https");
    global.internal.selfsigned = require("selfsigned");
    global.internal.process = require("process");
    global.executedDir = internal.process.cwd();
    global.fileIO = require("./util/fileIO.js");
    global.utility = require("./util/utility.js");
    global.logger = require("./util/logger.js").logger;
    //
    // -------------------------------------------------------

    // -------------------------------------------------------
    // Setup ConfigController
    ConfigController.rebuildFromBaseConfigs();
    // -------------------------------------------------------
    // Rebuild user/configs/server.json from user/configs/server_base.json
    //this.refreshServerConfigFromBase();
    // -------------------------------------------------------
    // Rebuild user/configs/gameplay.json from user/configs/gameplay_base.json
    //this.refreshGameplayConfigFromBase();

    // -------------------------------------------------------
    // Build the "db" object network from the root db folder (this is NOT the actual database)
    Initializer.buildReadOnlyDbFolder();
    // -------------------------------------------------------
    // Build the In-Memory database from db object network
    DatabaseController.loadDatabase();

    // -------------------------------------------------------
    // Load the mods
    global.mods = { toLoad: {}, config: {} };
    global.mods_f = require("./server/mods.js");
    global.mods_f.load();
    global.mods_f.ResModLoad();
    global.mods_f.TamperModLoad();

    // -------------------------------------------------------
    // Adjust weapon recoil by user/configs/gameplay.json file
    // TODO: This needs to be moved somewhere else
    if (
      ConfigController.Configs["gameplay"]["weapons"]["cameraRecoil"] !== undefined
      && ConfigController.Configs["gameplay"]["weapons"]["verticalRecoil"] !== undefined
      && ConfigController.Configs["gameplay"]["weapons"]["horizontalRecoil"] !== undefined
    ) {
      for (const itemVar in global._database.items) {

        const item = global._database.items[itemVar];
        if (item["_props"] !== undefined && item["_props"]["CameraRecoil"] !== undefined) {
          item["_props"]["CameraRecoil"] *= (ConfigController.Configs["gameplay"]["weapons"]["cameraRecoil"] / 100)
        }
        if (item["_props"] !== undefined && item["_props"]["RecoilForceUp"] !== undefined) {
          item["_props"]["RecoilForceUp"] *= (ConfigController.Configs["gameplay"]["weapons"]["verticalRecoil"] / 100)
        }
        if (item["_props"] !== undefined && item["_props"]["RecoilForceBack"] !== undefined) {
          item["_props"]["RecoilForceBack"] *= (ConfigController.Configs["gameplay"]["weapons"]["horizontalRecoil"] / 100)
        }
        global._database.items[itemVar] = item;
      }
    }
  }

  /**
   * Parses through the filepath recursively creating a network of objects
   * @param {*} filepath 
   * @param {*} deep 
   * @returns {object} network of objects
   */
  static scanRecursiveRoute(filepath, deep = false) { // recursively scans given path
    if (filepath == "db/")
      if (!fileIO.exist("db/"))
        return;
    let baseNode = {};
    let directories = utility.getDirList(filepath);
    let files = fileIO.readDir(filepath);

    // remove all directories from files
    for (let directory of directories) {
      for (let file in files) {
        if (files[file] === directory) {
          files.splice(file, 1);
        }
      }
    }

    // make sure to remove the file extention
    for (let node in files) {
      let fileName = files[node].split('.').slice(0, -1).join('.');
      baseNode[fileName] = filepath + files[node];
    }

    // deep tree search
    for (let node of directories) {
      //if(node != "items" && node != "assort" && node != "customization" && node != "locales" && node != "locations" && node != "templates")
      baseNode[node] = Initializer.scanRecursiveRoute(filepath + node + "/");
    }

    return baseNode;
  }

  /**
   * Paulov. I don't know why this happens or exists
   * P.S. Moved this from "mods.js"????
   */
  static buildReadOnlyDbFolder() { // populate global.db and global.res with folders data
    global.db = {};
    // logger.logInfo("Rebuilding cache: route database");
    global.db = Initializer.scanRecursiveRoute("db/");
    // logger.logInfo("Rebuilding cache: route resources");
    global.res = Initializer.scanRecursiveRoute("res/");
    global.files = Initializer.scanRecursiveRoute("files/");

    // populate res/bundles
    res.bundles = { files: [], folders: [] };
    // var path = 'res/bundles';
    // var results = fileIO.readDir(path, true);
    // var bundles = results.filter(x => x.toLowerCase().endswith('.bundle'));
    // var bundlePaths = bundles.map(x => internal.path.resolve(path, x));
    // res.bundles.files = res.bundles.files.concat(bundlePaths);

    /* add important server paths */
    db.user = {
      configs: {
        server: "user/configs/server.json",
        gameplay: "user/configs/gameplay.json",
        // cluster: "user/configs/cluster.json",
        // blacklist: "user/configs/blacklist.json",
        mods: "user/configs/mods.json"
      },
      events: {
        schedule: "user/events/schedule.json"
      },
      profiles: {
        character: "user/profiles/__REPLACEME__/character.json",
        dialogue: "user/profiles/__REPLACEME__/dialogue.json",
        storage: "user/profiles/__REPLACEME__/storage.json",
        userbuilds: "user/profiles/__REPLACEME__/userbuilds.json"
      }
    }
    // fileIO.write("user/cache/db.json", db);
    // fileIO.write("user/cache/res.json", res);
  }

  refreshServerConfigFromBase() {
    if (!fs.existsSync(process.cwd() + "/user/configs/server_base.json"))
      throw "Could not find " + process.cwd() + "/user/configs/server_base.json";

    const serverConfigBase = JSON.parse(fs.readFileSync(process.cwd() + "/user/configs/server_base.json"));
    if (serverConfigBase === undefined)
      throw "Server Config Base data not found";

    if (!fs.existsSync(process.cwd() + "/user/configs/server.json"))
      fs.writeFileSync(process.cwd() + "/user/configs/server.json", JSON.stringify(serverConfigBase));

    if (fs.existsSync(process.cwd() + "/user/configs/server.json"))
      global.serverConfig = JSON.parse(fs.readFileSync(process.cwd() + "/user/configs/server.json"));

    let changesMade = false;
    for (let item in serverConfigBase) {
      if (global.serverConfig[item] === undefined) {
        global.serverConfig[item] = serverConfigBase[item];
        logger.logInfo("Adding Config Setting " + item + " to server.json");
        changesMade = true;
      }
    }

    if (changesMade)
      fs.writeFileSync(process.cwd() + "/user/configs/server.json", JSON.stringify(global.serverConfig));
  }

  refreshGameplayConfigFromBase() {
    const configBase = JSON.parse(fs.readFileSync("user/configs/gameplay_base.json"));
    if (!fs.existsSync("user/configs/gameplay.json"))
      fs.writeFileSync("user/configs/gameplay.json", JSON.stringify(configBase));

    let gpjson = {};
    if (fs.existsSync("user/configs/gameplay.json"))
      gpjson = JSON.parse(fs.readFileSync("user/configs/gameplay.json"));

    let changesMade = false;
    for (let item in configBase) {
      if (gpjson[item] === undefined) {
        gpjson[item] = configBase[item];
        logger.logInfo("Adding Config Setting " + item + " to gameplay.json");
        changesMade = true;
      }
    }

    if (changesMade)
      fs.writeFileSync("user/configs/gameplay.json", JSON.stringify(gpjson));
  }


  initializeCacheCallbacks() {
    //     this.cacheCallback = {};

    //     logger.logDebug("Loading Database...");
    //     const databasePath = "/src/functions/database.js";
    //     const executedDir = process.cwd();
    //     logger.logDebug(`ExecutedDir: ${executedDir}`);
    //     // require(executedDir + databasePath).load();
    //     // database.load();


    // // let path = "./src/cache";
    // //     let files = fileIO.readDir(path);
    // //     for (let file of files) {
    // //       let scriptName = "cache" + file.replace(".js", "");
    // //       this.cacheCallback[scriptName] = require("../src/cache/" + file).cache;
    // //     }
    // //     logger.logSuccess("Create: Cache Callback");

    // //     // execute cache callback
    // //     if (serverConfig.rebuildCache) {
    // //        logger.logInfo("[Warmup]: Cache callbacks...");
    // //       for (let type in this.cacheCallback) {
    // //         this.cacheCallback[type]();
    // //       } 
    // //       global.mods_f.CacheModLoad(); // CacheModLoad
    // //     }
    //     global.mods_f.ResModLoad(); // load Res Mods
  }

  /* load exception handler */
  initializeExceptions() {
    internal.process.on("uncaughtException", (error, promise) => {
      logger.logData(error);
    });
  }

  /* load loadorder from cache */
  initializeItemRoute() {
    // logger.logSuccess("Create: Item Action Callbacks");
    // Load Item Route's
    // move this later to other file or something like that :)
    item_f.handler.updateRouteStruct();
    let itemHandlers = "";
    for (let iRoute in item_f.handler.routeStructure) {
      itemHandlers += iRoute + ", ";
      item_f.handler.addRoute(iRoute, item_f.handler.routeStructure[iRoute]);
    }
    // logger.logInfo("[Actions] " + itemHandlers.slice(0, -2));
  }

  /* load classes */
  initializeClasses() {
    // logger.logSuccess("Create: Classes as global variables");
    //let path = global.executedDir + "/src/classes/";
    //let files = fileIO.readDir(path);
    let loadedModules = "";
    const loadOrder = [
      "helper.js",
      // "account.js",
      "bots.js",
      "bundles.js",
      "customization.js",
      "dialogue.js",
      "globals.js",
      "health.js",
      "hideout.js",
      "home.js",
      "insurance.js",
      "profile.js",
      "item.js",
      "keepalive.js",
      "locale.js",
      "location.js",
      // "match.js",
      "move.js",
      "note.js",
      "notifier.js",
      "offraid.js",
      "preset.js",
      "quest.js",
      "ragfair.js",
      "repair.js",
      "response.js",
      "savehandler.js",
      "status.js",
      "trade.js",
      "trader.js",
      "weaponbuilds.js",
      "weather.js",
      "wishlist.js",
    ];
    for (let file of loadOrder) {
      loadedModules += file.replace(".js", ", ");
      let name = file.replace(".js", "").toLowerCase() + "_f"; // fixes the weaponbuilds.js file bug ... lol
      // global[name] = require(process.cwd() + "/src/classes/" + file);
      global[name] = require(__dirname + "/../src/classes/" + file);
    }
    // logger.logInfo("[Modules] " + loadedModules.slice(0, -2));
  }
}

module.exports.initializer = new Initializer();