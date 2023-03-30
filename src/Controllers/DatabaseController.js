const { ConfigController } = require('./ConfigController');
const fs = require('fs');
const fileIO = require('./../../core/util/fileIO');
const utility = require('./../../core/util/utility');

class Database {
    constructor() {
        this.bots = {};
        this.core = {};
        this.customization = {};
        this.gameplay = {};
        this.globals = {};
        this.hideout = {};
        this.items = {};
        this.itemPriceTable = {};
        this.quests = []; // Note Array
        this.repeatableQuests = [];
        this.languages = {};
        this.locales = {};
        this.locations = {};
        this.traders = {};
        this.weather = [];
    }
}
/**
 * 
 */
global._database = new Database();

/**
 * 
 */
class DatabaseController 
{
    /**
     * The In-Memory Database
     */
    static Database = new Database();

    static createGlobalDatabase() {
        // const watchedDb = onChange(database, function (path, value, previousValue, applyData) {
        //     console.log('Object changed:', ++index);
        //     console.log('this:', this);
        //     console.log('path:', path);
        //     console.log('value:', value);
        //     console.log('previousValue:', previousValue);
        //     console.log('applyData:', applyData);
        // });
    }

    /**
     * Retrieves the global in memory database
     * @returns {Database} the globally defined Database
     */
    static getDatabase() {
        ConfigController.init();
        if(global._database === undefined || global._database.traders === undefined) {
            DatabaseController.loadDatabase();
        }

        return global._database;
    }
}

// // ---------------------------------------------------
// // If haven't already, create base global database
// DatabaseController.createGlobalDatabase();

module.exports.DatabaseController = DatabaseController;
module.exports.DbController = new DatabaseController();

function loadGlobals() {
    const database = DatabaseController.getDatabase();
    database.globals = fileIO.readParsed("./" + db.base.globals);
    //allow to use file with {data:{}} as well as {}
    if (database.globals.data !== undefined) database.globals = database.globals.data;
}

function loadGameplayConfig() {
    const database = DatabaseController.getDatabase();

    database.gameplay = fileIO.readParsed("./user/configs/gameplay_base.json");
}

function loadBotsData() {
    const database = DatabaseController.getDatabase();
    database.bots = {};
    for (let botType in db.bots) {
        database.bots[botType] = {};
        let difficulty_easy = null;
        let difficulty_normal = null;
        let difficulty_hard = null;
        let difficulty_impossible = null;
        if (typeof db.bots[botType].difficulty != "undefined") {
        if (typeof db.bots[botType].difficulty.easy != "undefined") difficulty_easy = fileIO.readParsed("./" + db.bots[botType].difficulty.easy);
        if (typeof db.bots[botType].difficulty.normal != "undefined") difficulty_normal = fileIO.readParsed("./" + db.bots[botType].difficulty.normal);
        if (typeof db.bots[botType].difficulty.hard != "undefined") difficulty_hard = fileIO.readParsed("./" + db.bots[botType].difficulty.hard);
        if (typeof db.bots[botType].difficulty.impossible != "undefined") difficulty_impossible = fileIO.readParsed("./" + db.bots[botType].difficulty.impossible);
        }
        database.bots[botType].difficulty = {
        easy: difficulty_easy,
        normal: difficulty_normal,
        hard: difficulty_hard,
        impossible: difficulty_impossible,
        };
        if(db.bots[botType].profile !== undefined) {
            database.bots[botType].appearance = { body: [], feet: [], hands: [], head: [], voice: []};
            database.bots[botType].chances = {};
            database.bots[botType].generation = {};
            database.bots[botType].health = {};
            database.bots[botType].inventory = {};

            for(const p in db.bots[botType].profile) {
                const fileLocation = db.bots[botType].profile[p];
                if(fs.existsSync(fileLocation)) {
                    const data = JSON.parse(fs.readFileSync(fileLocation)).data;
                    database.bots[botType].profile = data;
                    database.bots[botType].appearance.body.push(data.Customization.Body);
                    database.bots[botType].appearance.feet.push(data.Customization.Feet);
                    database.bots[botType].appearance.hands.push(data.Customization.Hands);
                    database.bots[botType].appearance.head.push(data.Customization.Head);
                    database.bots[botType].appearance.voice.push(data.Customization.Voice);
                    database.bots[botType].health = data.Health;
                    // load inventory
                    database.bots[botType].inventory["0_80"] = data.Inventory;
                }
            }
        }
        else {
            database.bots[botType].appearance = fileIO.readParsed("./" + db.bots[botType].appearance);
            database.bots[botType].chances = fileIO.readParsed("./" + db.bots[botType].chances);
            database.bots[botType].experience = fileIO.readParsed("./" + db.bots[botType].experience);
            database.bots[botType].generation = fileIO.readParsed("./" + db.bots[botType].generation);
            database.bots[botType].health = fileIO.readParsed("./" + db.bots[botType].health);
            database.bots[botType].inventory = {};
            for (const name in db.bots[botType].inventory) {
                database.bots[botType].inventory[name] = fileIO.readParsed("./" + db.bots[botType].inventory[name]);
            }
        }
    }
    database.bots.names = fileIO.readParsed("./" + db.base.botNames);
}

function loadCoreData() {
    const database = DatabaseController.getDatabase();
    database.core = {};
    database.core.botBase = fileIO.readParsed("./" + db.base.botBase);
    database.core.botCore = fileIO.readParsed("./" + db.base.botCore);
    database.core.fleaOffer = fileIO.readParsed("./" + db.base.fleaOffer);
    database.core.matchMetrics = fileIO.readParsed("./" + db.base.matchMetrics);
}

function loadItemsData() {

    const database = DatabaseController.getDatabase();
    var gameplayConfig = ConfigController.Configs["gameplay"];
    database.items = fileIO.readParsed(db.items["Items"]);

    database.templates = {};
    database.templates.Categories = fileIO.readParsed(db.templates.categories)
    database.templates.Items = fileIO.readParsed(db.templates.items);

    const itemHandbook = database.templates.Items;
    database.itemPriceTable = {};
    for (let item of itemHandbook) {
        database.itemPriceTable[item.Id] = item.Price;
    }
}

function loadHideoutData() {
    const database = DatabaseController.getDatabase();

    database.hideout = { settings: {}, areas: [], production: [], scavcase: [] };

    database.hideout.settings = fileIO.readParsed("./" + db.hideout.settings);
  // if (typeof database.hideout.settings.data != "undefined") {
  //   database.hideout.settings = database.hideout.settings.data;
  // }
  const dbAreas = JSON.parse(fs.readFileSync("./" + db.hideout.areas["_items"]));
  database.hideout.areas = dbAreas;
  // for (let area in dbAreas) {
  //   database.hideout.areas.push(dbAreas[area]);
  // }
  // for (let area in db.hideout.areas) {
  //   if(area !== "_items")
  //     database.hideout.areas.push(fileIO.readParsed("./" + db.hideout.areas[area]));
  // }
  for (let production in db.hideout.production) {
    database.hideout.production.push(fileIO.readParsed("./" + db.hideout.production[production]));
  }
  for (let scavcase in db.hideout.scavcase) {
    database.hideout.scavcase.push(fileIO.readParsed("./" + db.hideout.scavcase[scavcase]));
  }

  // apply production time divider
  // for (const area of database.hideout.areas) {
  //   for (const stageIndex in area.stages) {
  //     const stage = area.stages[stageIndex];
  //     if (stage.constructionTime != 0 && stage.constructionTime > database.gameplay.hideout.productionTimeDivide_Areas) {
  //       // stage.constructionTime = stage.constructionTime / database.gameplay.hideout.productionTimeDivide_Areas;
  //     }
  //   }
  // }
  for (let id in database.hideout.production) {
    if (database.hideout.production[id].productionTime != 0 && database.hideout.production[id].productionTime > database.gameplay.hideout.productionTimeDivide_Production) {
        database.hideout.production[id].productionTime = database.hideout.production[id].productionTime / database.gameplay.hideout.productionTimeDivide_Production;
    }
  }
  for (let id in database.hideout.scavcase) {
    if (database.hideout.production[id].ProductionTime != 0 && database.hideout.production[id].ProductionTime > database.gameplay.hideout.productionTimeDivide_ScavCase) {
        database.hideout.production[id].ProductionTime = database.hideout.production[id].ProductionTime / database.gameplay.hideout.productionTimeDivide_ScavCase;
    }
  }
}

function loadQuestsData() {
    const database = DatabaseController.getDatabase();

  // database.quests = fileIO.readParsed("./" + db.quests.quests);
  // if (typeof database.quests.data != "undefined") database.quests = database.quests.data;

  database.quests = [];
  // const oldQuests = fileIO.readParsed("./" + db.quests.quests);

  // - Convert Aki's working Quests to JETs quest array // 
  const objectQData = fileIO.readParsed("./" + db.quests["quests.aki.0.12.12.30"]);
  if(objectQData !== undefined) {
    for(const q in objectQData) {
      const quest = objectQData[q];
      // if(quest.conditions.AvailableForStart.length === 0) {
      //   const oldQuest = oldQuests.find(x=>x._id === quest._id);
      //   if(oldQuest && oldQuest.conditions.AvailableForStart.length > 0) {
      //     quest.conditions.AvailableForStart = oldQuest.conditions.AvailableForStart;
      //   }
      // }
      database.quests.push(quest);
    }
  }

  database.repeatableQuests = fileIO.readParsed("./" + db.quests.repeatableQuests);
  
}

function loadCustomizationData() {
    const database = DatabaseController.getDatabase();

    database.customization = {};
  let data = JSON.parse(fs.readFileSync(db.customization["_items"]));
  for(let id in data) {
    database.customization[id] = data[id];
  }
 
}

function loadLocaleData() {
    const database = DatabaseController.getDatabase();

    database.languages = fileIO.readParsed("./" + db.locales.languages);
  // provide support for using dumps
  if (database.languages.data !== undefined) database.languages = database.languages.data;

  database.locales = { menu: {}, global: {} };

  for (let lang in db.locales) {
    if (lang == "languages") { continue; }

    lang = lang.toLowerCase(); // make sure its always lower case

    database.locales.menu[lang] = fileIO.readParsed("./" + db.locales[lang].menu);
    if (typeof database.locales.menu[lang].data != "undefined") {
        database.locales.menu[lang] = database.locales.menu[lang].data;
    }
    database.locales.global[lang] = fileIO.readParsed("./" + db.locales[lang].locale);
    if (typeof database.locales.global[lang].data != "undefined") {
        database.locales.global[lang] = database.locales.global[lang].data;
    }
  }
}

function createForcedDynamicStruct(item_data) {
  let isStatic = false;
  let useGravity = false;
  let randomRotation = false;
  let position = { x: 0, y: 0, z: 0 };
  let rotation = { x: 0, y: 0, z: 0 };
  let IsGroupPosition = false;
  let GroupPositions = [];

  if (typeof item_data.IsStatic != "undefined") isStatic = item_data.IsStatic;
  if (typeof item_data.useGravity != "undefined")
    useGravity = item_data.useGravity;
  if (typeof item_data.randomRotation != "undefined")
    randomRotation = item_data.randomRotation;

  if (item_data.Position != 0 && item_data.Position != "0") {
    position.x = item_data.Position.x;
    position.y = item_data.Position.y;
    position.z = item_data.Position.z;
  }
  if (item_data.Rotation != 0 && item_data.Rotation != "0") {
    rotation.x = item_data.Rotation.x;
    rotation.y = item_data.Rotation.y;
    rotation.z = item_data.Rotation.z;
  }
  if (typeof item_data.IsGroupPosition != "undefined") {
    IsGroupPosition = item_data.IsGroupPosition;
    GroupPositions = item_data.GroupPositions;
  }

  let Root =
    typeof item_data.Items[0] == "string"
      ? item_data.id
      : item_data.Items[0]._id;
  item_data.Items = item_data.Items.splice(0, 1);

  return {
    Id: item_data.id !== undefined ? item_data.id : item_data.Id,
    IsStatic: isStatic,
    useGravity: useGravity,
    randomRotation: randomRotation,
    Position: position,
    Rotation: rotation,
    IsGroupPosition: IsGroupPosition,
    GroupPositions: GroupPositions,
    Items: item_data.Items,
  };
}
function createStaticMountedStruct(item_data) {
  let isStatic = false;
  let useGravity = false;
  let randomRotation = false;
  let position = { x: 0, y: 0, z: 0 };
  let rotation = { x: 0, y: 0, z: 0 };
  let IsGroupPosition = false;
  let GroupPositions = [];

  if (typeof item_data.IsStatic != "undefined") isStatic = item_data.IsStatic;
  if (typeof item_data.useGravity != "undefined")
    useGravity = item_data.useGravity;
  if (typeof item_data.randomRotation != "undefined")
    randomRotation = item_data.randomRotation;
  if (item_data.Position != 0 && item_data.Position != "0") {
    position.x = item_data.Position.x;
    position.y = item_data.Position.y;
    position.z = item_data.Position.z;
  }
  if (item_data.Rotation != 0 && item_data.Rotation != "0") {
    rotation.x = item_data.Rotation.x;
    rotation.y = item_data.Rotation.y;
    rotation.z = item_data.Rotation.z;
  }
  if (typeof item_data.IsGroupPosition != "undefined") {
    IsGroupPosition = item_data.IsGroupPosition;
    GroupPositions = item_data.GroupPositions;
  }
  //console.log(typeof item_data.Items[0]);
  //console.log(item_data.id);
  let Root =
    typeof item_data.Items[0] == "string"
      ? item_data.id
      : item_data.Items[0]._id;

  item_data.Items = item_data.Items.splice(0, 1);
  return {
    Id: item_data.id !== undefined ? item_data.id : item_data.Id,
    IsStatic: isStatic,
    useGravity: useGravity,
    randomRotation: randomRotation,
    Position: position,
    Rotation: rotation,
    IsGroupPosition: IsGroupPosition,
    GroupPositions: GroupPositions,
    Root: Root, // id of container
    Items: item_data.Items,
  };
}

function loadLocationData() {
    const database = DatabaseController.getDatabase();

  database.locations = {};
  for (let name in db.locations.base) {
    let _location = { "base": {}, "loot": {} };
    _location.base = fileIO.readParsed(db.locations.base[name]);

    // initialised internal loot
    _location.loot = { forced: [], mounted: [], static: [], dynamic: [] };

    // Do stuff with in file Loot table
    if(_location.base.Loot !== undefined && _location.base.Loot.length > 0) {
      for(const item of _location.base.Loot) {
        const type = item.IsStatic && item.Items[0]._id === item.Root ? "static" : "dynamic";
        if(
          _location.loot["static"].findIndex(x=>x.Id === item.Id) === -1
          && _location.loot["dynamic"].findIndex(x=>x.Id === item.Id) === -1)
        {
          _location.loot[type].push(
            type == "static" ?  createStaticMountedStruct(item) : createForcedDynamicStruct(item)
            );
        }
      }
    }
    
    if (typeof db.locations.loot[name] != "undefined") {
      let loot_data = fileIO.readParsed(db.locations.loot[name]);
      for (let type in loot_data) {
        for (let item of loot_data[type]) {

          if(_location.loot[type].findIndex(x=>x.Id === item.Id) === -1)
          {
            if (type == "static" || type == "mounted") {
              
              _location.loot[type].push(createStaticMountedStruct(item));
              continue;
            }
            _location.loot[type].push(createForcedDynamicStruct(item));
          
          }

        }
      }
    }
    database.locations[name] = _location;
    // if(name.includes("lighthouse")) {
    //   console.log(_location);
    // }
  }
  database.core.location_base = fileIO.readParsed("./" + db.base.locations);
  database.locationConfigs = {};
  database.locationConfigs["StaticLootTable"] = fileIO.readParsed("./" + db.locations.StaticLootTable);
  database.locationConfigs["DynamicLootTable"] = fileIO.readParsed("./" + db.locations.DynamicLootTable);
}

function loadTraderAssort(traderId) {
    const database = DatabaseController.getDatabase();

  let base = { nextResupply: 0, items: [], barter_scheme: {}, loyal_level_items: {} };
  if(traderId == "579dc571d53a0658a154fbec")
    return base;

  const assort = fileIO.readParsed(db.traders[traderId].assort);
  // Recompile IDs - TODO: Check whether this is still needed
  if(assort.items !== undefined) {
    // Items
    const convertedIds = {};
    for(const it of assort.items) {
      let currId = it._id;
      // let newId = utility.generateNewItemId();
      // let newId = utility.generateNewId(undefined, 3);
      let newId = utility.generateNewId(undefined, 4);
      convertedIds[currId] = newId;
      it._id = newId;
    }
    for(const it of assort.items) {
      if(it.parentId !== undefined 
        && it.parentId.length === 24
        && convertedIds[it.parentId] !== undefined) {
        // console.log(it.parentId);
        it.parentId = convertedIds[it.parentId];
      }
    }
    // Barter Scheme
    const newBarterScheme = {};
    for(const id in assort.barter_scheme) {
      let currData = assort.barter_scheme[id]
      newBarterScheme[convertedIds[id]] = JSON.parse(JSON.stringify(currData));
    }
    assort.barter_scheme = JSON.parse(JSON.stringify(newBarterScheme));
    // Loyal Level Items
    const newLoyalLevel = {};
    for(const id in assort.loyal_level_items) {
      let currData = assort.loyal_level_items[id]
      newLoyalLevel[convertedIds[id]] = JSON.parse(JSON.stringify(currData));
    }
    // for(const it of assort.items) { 
    //   if(it.parentId === undefined && newLoyalLevel[it._id] === undefined) {
    //     console.log("");
    //   }
    // }
    assort.loyal_level_items = JSON.parse(JSON.stringify(newLoyalLevel));

    base.items = assort.items;
    base.barter_scheme = assort.barter_scheme;
    base.loyal_level_items = assort.loyal_level_items;
  }
  // do it JET way
  else { 
    for (let item in assort) {
      let items;
      if (traderId != "ragfair") {
        if (!utility.isUndefined(assort[item].items[0])) {
          let items = assort[item].items;


          /*
          copy properties of db item 
          There are a lot of properties missing and that is gay and retarded
          */

          items[0].upd = Object.assign({}, items[0].upd);
          if (utility.isUndefined(items[0].upd)) {
            items[0]["upd"] = Object.assign({}, items[0].upd);
          }

          if (utility.isUndefined(items[0].upd.UnlimitedCount)) {
            items[0].upd["UnlimitedCount"] = false;
          }

        }
      } else {
        let items = assort[item].items;
        if (utility.isUndefined(items[0])) {
          items[0]["upd"] = {};
          items[0].upd["UnlimitedCount"] = false;
          items[0].upd["StackObjectsCount"] = 99;
          items[0].upd["BuyRestrictionMax"] = 99;
          items[0].upd["BuyRestrictionCurrent"] = 0;
        }
      }

      items = assort[item].items;
      for (let assort_item in items) {
        base.items.push(items[assort_item]);
      }
      base.barter_scheme[item] = assort[item].barter_scheme;
      base.loyal_level_items[item] = assort[item].loyalty;
    }
  }
  return base;
}

function loadTradersData() {
    const database = DatabaseController.getDatabase();

  database.traders = {};
  for (let traderID in db.traders) {
    database.traders[traderID] = { base: {}, assort: {}, categories: {} };
    database.traders[traderID].base = fileIO.readParsed("./" + db.traders[traderID].base);
    database.traders[traderID].categories = database.traders[traderID].base.sell_category;
    if( 
      database.traders[traderID].base.sell_category.length === 0
      && fs.existsSync(`./db/traders/${traderID}/categories.json`)
      ) {
      database.traders[traderID].categories = fileIO.readParsed("./" + db.traders[traderID].categories);
      database.traders[traderID].base.sell_category = database.traders[traderID].categories; // override trader categories
    }

    database.traders[traderID].assort = { nextResupply: 0, items: [], barter_scheme: {}, loyal_level_items: {} };

    // Loading Assort depending if its Fence or not
    // if (traderID == "579dc571d53a0658a154fbec") {
    //   database.traders[traderID].base_assort = loadTraderAssort(traderID);
    //   database.traders[traderID].assort = { nextResupply: 0, items: [], barter_scheme: {}, loyal_level_items: {} };
    // } else {
      database.traders[traderID].assort = loadTraderAssort(traderID);
    // }
    // Loading Player Customizations For Buying
    if ("suits" in db.traders[traderID]) {
      if (typeof db.traders[traderID].suits == "string") {
        database.traders[traderID].suits = fileIO.readParsed(db.traders[traderID].suits);
      } else {
        let suitsTable = [];
        for (let file in db.traders[traderID].suits) {
          suitsTable.push(fileIO.readParsed(db.traders[traderID].suits[file]));
        }
        database.traders[traderID].suits = suitsTable;
      }
    }

    // Loading Trader Quests
    if (typeof db.traders[traderID].questassort != "undefined") {
      database.traders[traderID].questassort = fileIO.readParsed("./" + db.traders[traderID].questassort);
    }

    if (database.traders[traderID].base.repair.price_rate === 0) {
      database.traders[traderID].base.repair.price_rate = 100;
      database.traders[traderID].base.repair.price_rate *= database.gameplay.trading.repairMultiplier;
      database.traders[traderID].base.repair.price_rate -= 100;
    } else {
      database.traders[traderID].base.repair.price_rate *= database.gameplay.trading.repairMultiplier;
      if (database.traders[traderID].base.repair.price_rate == 0) database.traders[traderID].base.repair.price_rate = -1;
    }
    if (database.traders[traderID].base.repair.price_rate < 0) {
      database.traders[traderID].base.repair.price_rate = -100;
    }
  }
}

function loadWeatherData() {
    const database = DatabaseController.getDatabase();

  database.weather = [];
  let i = 0;
  for (let file in db.weather) {
    let filePath = db.weather[file];
    let fileData = fileIO.readParsed(filePath);

    // logger.logInfo("Loaded Weather: ID: " + i++ + ", Name: " + file.replace(".json", ""));
    database.weather.push(fileData);
  }
}

function loadRagfair() {
    const database = DatabaseController.getDatabase();


  const findChildren = (itemIdToFind, assort) => {
    let Array = [];
    for (let itemFromAssort of assort) {
      if (itemFromAssort.parentId == itemIdToFind) {
        Array.push(itemFromAssort)
        Array = Array.concat(findChildren(itemFromAssort._id, assort));
      }
    }
    return Array;
  }
  const fleaOfferTemplate = database.core.fleaOffer;
  const convertToRagfairAssort = (itemsToSell, barter_scheme, loyal_level, trader, counter = 911) => {

    let offer = utility.DeepCopy(fleaOfferTemplate);
    const traderObj = database.traders[trader].base;
    offer._id = itemsToSell[0]._id;
    offer.intId = counter;
    offer.user = {
      "id": traderObj._id,
      "memberType": 4,
      "nickname": traderObj.surname,
      "rating": 1,
      "isRatingGrowing": true,
      "avatar": traderObj.avatar
    };
    offer.root = itemsToSell[0]._id;
    offer.items = itemsToSell;
    offer.requirements = barter_scheme;

    if (utility.isUndefined(offer.buyRestrictionMax)) { 
      // console.log("offer.buyRestrictionMax - undefined"); 
    }
    offer.buyRestrictionMax = itemsToSell[0].upd.BuyRestrictionMax

    offer.loyaltyLevel = loyal_level;
    return offer;
  }
  let response = { "categories": {}, "offers": [], "offersCount": 100, "selectedCategory": "5b5f78dc86f77409407a7f8e" };
  let counter = 0;

  for (let trader in db.traders) {
    if (trader === "ragfair" || trader === "579dc571d53a0658a154fbec") {
      continue;
    }
    const allAssort = database.traders[trader].assort;

    for (let itemAssort of allAssort.items) {
      if (itemAssort.slotId === "hideout") {
        let barter_scheme = null;
        let loyal_level = 0;

        let itemsToSell = [];
        itemsToSell.push(itemAssort);
        itemsToSell = [...itemsToSell, ...findChildren(itemAssort._id, allAssort.items)];

        for (let barterFromAssort in allAssort.barter_scheme) {
          if (itemAssort._id == barterFromAssort) {
            barter_scheme = allAssort.barter_scheme[barterFromAssort][0];
            break;
          }
        }

        for (let loyal_levelFromAssort in allAssort.loyal_level_items) {
          if (itemAssort._id == loyal_levelFromAssort) {
            loyal_level = allAssort.loyal_level_items[loyal_levelFromAssort];
            break;
          }
        }

        /*         // Base items can't have parentId or slotId properties or the client will report errors
                if (typeof itemsToSell[0].parentId != 'undefined') {
                  delete itemsToSell[0].parentId;
                }
                if (typeof itemsToSell[0].slotId != 'undefined') {
                  delete itemsToSell[0].slotId;
                } */

        response.offers.push(convertToRagfairAssort(itemsToSell, barter_scheme, loyal_level, trader, counter));
        counter += 1;
      }
    }
  }
  database.ragfair_offers = response;
}

DatabaseController.loadDatabase = () => {
    ConfigController.init();
    database = new Database();
    DatabaseController.Database = new Database();

    logger.logDebug("Load: 'Core'");
    loadCoreData();
    logger.logDebug("Load: 'Globals'");
    loadGlobals();
    // logger.logDebug("Load: 'Cluster Config'")
    // loadClusterConfig();
    // logger.logDebug("Load: 'Blacklist'")
    // loadBlacklistConfig();
    logger.logDebug("Load: 'Gameplay'");
    loadGameplayConfig();
    logger.logDebug("Load: 'Bots'");
    loadBotsData();
    logger.logDebug("Load: 'Hideout'");
    loadHideoutData();
    logger.logDebug("Load: 'Quests'");
    loadQuestsData();
    logger.logDebug("Load: 'Items'");
    loadItemsData();
    logger.logDebug("Load: 'Customizations'");
    loadCustomizationData();
    logger.logDebug("Load: 'Locales'");
    loadLocaleData();
    logger.logDebug("Load: 'Locations'");
    loadLocationData();
    logger.logDebug("Load: 'Traders'");
    loadTradersData();
    logger.logDebug("Load: 'Flea Market'");
    loadRagfair();
    logger.logDebug("Load: 'Weather'");
    loadWeatherData();
    // logger.logInfo("Database loaded");
};






