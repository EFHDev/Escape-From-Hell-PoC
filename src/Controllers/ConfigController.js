const fs = require('fs');
const { logger } = require('./../../core/util/logger');

/**
 * Config Controller. 
 * This controller provides direct access to all the config json files found in user/configs
 */
class ConfigController {
    constructor() {
        ConfigController.rebuildFromBaseConfigs();
    }

    static Instance = new ConfigController();
    static Configs = {};
    static ConfigsRebuilt = false;

    static init() {
      ConfigController.rebuildFromBaseConfigs();
    }

    /**
     * Fills ConfigController.Configs with parsed JSON data from user/configs directory
     */
    static rebuildFromBaseConfigs() {
        if(ConfigController.ConfigsRebuilt)
          return;

        if(ConfigController.Configs === undefined)
            ConfigController.Configs = {};

        global.gameplayConfig = {};
        this.rebuildFromBaseConfig("gameplay", global.gameplayConfig)
        // this.refreshGameplayConfigFromBase();
        global.serverConfig = {};
        this.rebuildFromBaseConfig("server", global.serverConfig)
        // this.refreshServerConfigFromBase();
        global.questConfig = {};
        this.rebuildFromBaseConfig("quest", global.questConfig)

        const files = fs.readdirSync(`user/configs/`);
      
        for (const f of files) {
            const dataRaw = fs.readFileSync(`user/configs/${f}`);
            if(dataRaw !== undefined) {
                ConfigController.Configs[f.replace(".json", "")] = JSON.parse(dataRaw);
            }
        }


        ConfigController.ConfigsRebuilt = true;
        
    }


    /**
     * 
     * @param {string} configFileName Expects the exact file name within user/configs folder e.g. "server"
     * @param {object} globalVariable Expects the exact object variable e.g. global.serverConfig
     */
    static rebuildFromBaseConfig(configFileName, globalVariable) {

        if(configFileName === undefined)
            return;
        
        if(globalVariable === undefined)
            return;

        const baseFileLocation = process.cwd() + `/user/configs/${configFileName}_base.json`; 

        if(!fs.existsSync(baseFileLocation))
          throw "Could not find " + baseFileLocation;
    
        const configBase = JSON.parse(fs.readFileSync(baseFileLocation));
        if(configBase === undefined)
          throw "Config Base data not found";
    
        const configFileLocation = process.cwd() + `/user/configs/${configFileName}.json`; 

        if(!fs.existsSync(configFileLocation))
          fs.writeFileSync(configFileLocation, JSON.stringify(configBase, null, 1));
    
        globalVariable = JSON.parse(fs.readFileSync(configFileLocation));
    
        let changesMade = false;
        changesMade = ConfigController.mergeRecursiveIgnoringExisting(globalVariable, configBase);
    
        if(changesMade)
          fs.writeFileSync(configFileLocation, JSON.stringify(globalVariable, null, 1));
    }
/*
    static refreshServerConfigFromBase() {
        if(!fs.existsSync(process.cwd() + "/user/configs/server_base.json"))
          throw "Could not find " + process.cwd() + "/user/configs/server_base.json";
    
        const serverConfigBase = JSON.parse(fs.readFileSync(process.cwd() + "/user/configs/server_base.json"));
        if(serverConfigBase === undefined)
          throw "Server Config Base data not found";
    
        if(!fs.existsSync(process.cwd() + "/user/configs/server.json"))
          fs.writeFileSync(process.cwd() + "/user/configs/server.json", JSON.stringify(serverConfigBase));
    
        if(fs.existsSync(process.cwd() + "/user/configs/server.json"))
          global.serverConfig = JSON.parse(fs.readFileSync(process.cwd() + "/user/configs/server.json"));
    
        let changesMade = false;
        changesMade = ConfigController.mergeRecursiveIgnoringExisting(global.serverConfig, serverConfigBase);
    
        if(changesMade)
          fs.writeFileSync(process.cwd() + "/user/configs/server.json", JSON.stringify(global.serverConfig));
      }
    
      static refreshGameplayConfigFromBase() {
        const configBase = JSON.parse(fs.readFileSync("user/configs/gameplay_base.json"));
        if(!fs.existsSync("user/configs/gameplay.json"))
          fs.writeFileSync("user/configs/gameplay.json", JSON.stringify(configBase));
    
          let gpjson = {};
        if(fs.existsSync("user/configs/gameplay.json"))
          gpjson = JSON.parse(fs.readFileSync("user/configs/gameplay.json"));
    
        let changesMade = false;
        // for(let rootItem in configBase) {
        //   if(gpjson[rootItem] === undefined) {
        //     gpjson[rootItem] = configBase[rootItem];
        //     logger.logInfo("Adding Config Setting " + rootItem + " to gameplay.json");
        //     changesMade = true;
        //   }
        //   else {
        //     if(Object.keys(gpjson[rootItem]) !== undefined && Object.keys(gpjson[rootItem]).length > 0) {
        //       console.log(gpjson[rootItem]);
        //     }
        //   }
        // }
        changesMade = ConfigController.mergeRecursiveIgnoringExisting(gpjson, configBase);
    
        if(changesMade)
          fs.writeFileSync("user/configs/gameplay.json", JSON.stringify(gpjson));
      }
*/
      static mergeRecursiveIgnoringExisting(targetObject, sourceObject) {
        let changesMade = false;
        for(const key of Object.keys(sourceObject))
        {
          if (typeof sourceObject[key] === "object") {
            if (targetObject[key] === undefined) {
              targetObject[key] = {};
              changesMade = true;
            }
            const innerChangesMade = ConfigController.mergeRecursiveIgnoringExisting(targetObject[key], sourceObject[key]);
            if(innerChangesMade)
              changesMade = true;
          } else {
            if(targetObject[key] === undefined) {
              targetObject[key] = sourceObject[key];
              changesMade = true;
            }
          }
        };
        return changesMade;
      }

}

module.exports.ConfigController = ConfigController;
module.exports.ConfigControllerInstance = ConfigController.Instance;