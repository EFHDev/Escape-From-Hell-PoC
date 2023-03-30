"use strict";

const { logger } = require("../../core/util/logger");
const utility = require('./../../core/util/utility');
const { BotController } = require('../Controllers/BotController');
const { AccountController } = require("../Controllers/AccountController");
const { ItemController } = require("../Controllers/ItemController");

//use bot names in lowercase as it matches folders
const botSwaps = {
  "Customs": {
    //"bosssanitar": "sectantpriest"
  },
  "Factory": { //no way to distinguish between day and night using name so be careful
    //"bosssanitar" : "sectantpriest"
  },
  "Interchange": {

  },
  "Laboratory": {

  },
  "Lighthouse": {

  },
  "ReserveBase": {

  },
  "Shoreline": {

  },
  "Woods": {
    //"bosskilla": "sectantpriest"
  }
}

class BotsController {
  constructor() {

  }

  generatePlayerScav(sessionID) {
    let scavData = bots_f.botHandler.generate({ conditions: [{ Role: "playerScav", Limit: 1, Difficulty: "normal" }] }, sessionID);
    let scavItems = scavData[0].Inventory.items;

    // Remove secured container
    let findSecuredContainer = scavItems.find((item) => item.slotId === "SecuredContainer");
    let toRemove = helper_f.findAndReturnChildrenByItems(scavItems, findSecuredContainer._id);
    let n = scavItems.length;
    while (n-- > 0) {
      if (toRemove.includes(scavItems[n]._id)) {
        scavItems.splice(n, 1);
      }
    }
    scavData[0].Info.Settings = {};
    return scavData[0];
  }
  getBotLimit(type) {
    // if (typeof global._database.gameplay.bots.limits[type === "cursedAssault" || type === "assaultGroup" ? "assault" : type] == "undefined") return 30;
    // return global._database.gameplay.bots.limits[type === "cursedAssault" || type === "assaultGroup" ? "assault" : type];
    return 5;
  }
  getBotDifficulty(type, difficulty) {
    switch (type) {
      // requested difficulty shared among bots
      case "core":
        return global._database.core.botCore;
      // don't replace type
      default:
        return global._database.bots[type].difficulty[difficulty];
    }
  }



  // generateId(bot) {
  //   const botId = utility.generateNewAccountId();
  //   bot._id = botId;
  //   bot.aid = botId;
  //   return bot;
  // }

  //START -----
  static generateBot(bot, role, pmcData) {
    let node = [];

    // debugging generatebot
    // console.log("generateBot");
    // console.log(bot);
    // console.log(role);
    // console.log(pmcData);

    const loweredRole = role.toLowerCase();
    //default
    node = global._database.bots[bot.Info.Settings.Role.toLowerCase()];
    // console.log("generateBot::role");
    // console.log(role);
    if (loweredRole == "playerscav") {
      bot.Info.Side = "Savage";
      node = global._database.bots["assault"];
      bot.Info.Voice = utility.getArrayValue(node.appearance.voice);
    }
    // -----------------------------------------------------------------------------
    // Paulo: This allows the location json files to include "PmcBot" as a spawnable
    else if (loweredRole == "pmcbot") {
      bot.Info.Side = utility.getRandomInt(0, 100) > 10 ? "Usec" : "Bear";
      node = global._database.bots["pmcbot"];
      bot.Info.Voice = "Usec_1";
    }
    else {

      bot.Info.Side = "Savage";
      node = global._database.bots[loweredRole];
      // console.log(node);
      // console.log(bot);
      bot.Info.Voice = utility.getArrayValue(node.appearance.voice);
    
    }

    if(loweredRole.includes("knight") || loweredRole.includes("bigpipe") || loweredRole.includes("birdeye")) {
      console.log(bot);
    }

    bot.Info.Nickname = BotController.generateBotName(role);
    bot.Info.Settings.BotDifficulty = "normal";
    if(node.experience === undefined || node.experience.reward === undefined || node.experience.reward.min === undefined) {
      logger.logError(`Bot ${role} could not find experience reward`)
      node.experience = { reward: { min: 100, max: 300 } };
    }
    bot.Info.Settings.Experience = utility.getRandomInt(node.experience.reward.min, node.experience.reward.max);
    if(node.appearance === undefined || node.appearance.voice === undefined) {
      logger.logError(`Bot ${role} could not find appearance or voice`)
      node.appearance = { voice: "Usec_1" };
    }
    bot.Info.Voice = utility.getArrayValue(node.appearance.voice);
    bot.Health = bots_f.botHandler.generateHealth(node.health);
    bot.Customization.Head = utility.getArrayValue(node.appearance.head);
    bot.Customization.Body = utility.getArrayValue(node.appearance.body);
    bot.Customization.Feet = utility.getArrayValue(node.appearance.feet);
    bot.Customization.Hands = utility.getArrayValue(node.appearance.hands);

    const pmcLevel = (pmcData && pmcData.Info && pmcData.Info.Level) ? pmcData.Info.Level : 1;
    let inventoryData = "";
    for (const inventoryNode in node.inventory) {
      const levelFromTo = inventoryNode.split("_");
      const levelFrom = parseInt(levelFromTo[0]);
      const levelTo = parseInt(levelFromTo[1]);

      if (pmcLevel >= levelFrom && pmcLevel < levelTo) {
        inventoryData = node.inventory[inventoryNode];
        break;  // once we got our datas, no need to keep looping
      }
    }
    if (inventoryData == "") {
      // inventory is empty using fallback
      inventoryData = node.inventory[Object.keys(node.inventory)[0]];
    }

    if(inventoryData && inventoryData.items && inventoryData.items.length > 0) {
      bot.Inventory = inventoryData;
      bot = BotController.generateId(bot);
    }
    else {
      bot.Inventory = BotGenerator.generateInventory(inventoryData, node.chances, node.generation, role);

      const levelResult = bots_f.botHandler.generateRandomLevel(
        node.experience.level.min,
        node.experience.level.max,
        pmcData && pmcData.Info && pmcData.Info.Level ? pmcData.Info.Level : 1
      );
      bot.Info.Experience = levelResult.exp;
      bot.Info.Level = levelResult.level;

      if (bot.Info.Side.toLowerCase() == "usec"
        || bot.Info.Side.toLowerCase() == "bear"
        || loweredRole == "pmcbot"
        ) {
        bot = BotController.generateDogtag(bot);
      }

      // generate new bot ID
      bot = BotController.generateId(bot);

      // generate new inventory ID
      bot = utility.generateInventoryID(bot);
    }

    // console.log(bot);
    // console.log(role);

    return bot;

  }

  //bot is a complete bot object, map is a string with the location Name (not id)
  isCustomBot(bot, map) {
    if (bot.Info.Settings.Role.toLowerCase() in botSwaps[map]) {
      //logger.logError("CUSTOM BOT: "+bot.Info.Settings.Role+" in "+map);
      return true;
    }
    return false;
  }

  /**
   * Generate a bot 
   * You can test run this by running `bots_f.botHandler.generate({conditions: [{ Role: "pmcBot", Limit: 5 }]}, "AID062158106353313252ruc");` in the debug console
   * @param {*} info 
   * @param {*} sessionID 
   * @returns {object}
   */
  generate(info, sessionID) {
    let dateNow = Date.now();
    let count = 0;
    let output = [];
    const pmcData = AccountController.getPmcProfile(sessionID);

    for (const condition of info.conditions) {
      condition.Limit = Math.min(100, condition.Limit);
      condition.Limit = Math.max(1, condition.Limit);
      let role = condition.Role.toLowerCase();
      if(!_database.bots[role]) {
        logger.logError(`Role ${role} not found in database, ignoring.`)
        continue;
      }
      for (let i = 0; i < condition.Limit; i++) {
        let bot = {};
        if(_database.bots[role] && _database.bots[role].profile) {
          bot = _database.bots[role].profile;
          bot = BotController.generateId(bot);
        }
        else {
          bot = JSON.parse(JSON.stringify(global._database.core.botBase));
          bot.Info.Settings.Role = condition.Role;
          // bot.Info.Settings.Role = "pmcBot"; // Testing!
          bot.Info.Settings.BotDifficulty = condition.Difficulty;
          bot = BotsController.generateBot(bot, role, pmcData);
          // output.unshift(bot);
        }
        output.push(bot);
        count++;
      }
    }
    //if we generated bots and are in raid
    // if (count > 0 && offraid_f.handler.getPlayer(sessionID)) {
    if (count > 0) {
      logger.logSuccess(
        // "\u001b[32;1mGenerated: " + count + " bots for " + offraid_f.handler.getPlayer(sessionID).Location + " map. (" + (Date.now() - dateNow) + "ms)"
        "\u001b[32;1mGenerated: " + count + " bots. (" + (Date.now() - dateNow) + "ms)"
      );
    }
    return output;
  }

  generateRandomLevel(min, max, playerLevel) {
    const expTable = global._database.globals.config.exp.level.exp_table;
    const maxLevel = Math.min(max, expTable.length);

    // limit the bots level to match the player level
    let limitted_max_level = playerLevel + 10;
    let limitted_min_level = playerLevel - 5;
    if (limitted_max_level > maxLevel) {
      limitted_max_level = maxLevel;
    }
    if (playerLevel <= 5) {
      limitted_min_level = 1;
    };

    // Get random level based on the exp table.
    let exp = 0;

    let level = utility.getRandomInt(limitted_min_level, limitted_max_level);

    for (let i = 0; i < level; i++) {
      exp += expTable[i].exp;
    }

    // Sprinkle in some random exp within the level, unless we are at max level.
    if (level < expTable.length - 1) {
      exp += utility.getRandomInt(0, expTable[level].exp - 1);
    }

    return { level, exp };
  }

  /** Converts health object to the required format */
  generateHealth(healthObj) {
    return {
      Hydration: {
        Current: utility.getRandomInt(healthObj.Hydration.min, healthObj.Hydration.max),
        Maximum: healthObj.Hydration.max,
      },
      Energy: {
        Current: utility.getRandomInt(healthObj.Energy.min, healthObj.Energy.max),
        Maximum: healthObj.Energy.max,
      },
      Temperature: {
        Current: utility.getRandomInt(healthObj.Temperature.min, healthObj.Temperature.max),
        Maximum: healthObj.Temperature.max,
      },
      BodyParts: {
        Head: {
          Health: {
            Current: utility.getRandomInt(healthObj.BodyParts.Head.min, healthObj.BodyParts.Head.max),
            Maximum: healthObj.BodyParts.Head.max,
          },
        },
        Chest: {
          Health: {
            Current: utility.getRandomInt(healthObj.BodyParts.Chest.min, healthObj.BodyParts.Chest.max),
            Maximum: healthObj.BodyParts.Chest.max,
          },
        },
        Stomach: {
          Health: {
            Current: utility.getRandomInt(healthObj.BodyParts.Stomach.min, healthObj.BodyParts.Stomach.max),
            Maximum: healthObj.BodyParts.Stomach.max,
          },
        },
        LeftArm: {
          Health: {
            Current: utility.getRandomInt(healthObj.BodyParts.LeftArm.min, healthObj.BodyParts.LeftArm.max),
            Maximum: healthObj.BodyParts.LeftArm.max,
          },
        },
        RightArm: {
          Health: {
            Current: utility.getRandomInt(healthObj.BodyParts.RightArm.min, healthObj.BodyParts.RightArm.max),
            Maximum: healthObj.BodyParts.RightArm.max,
          },
        },
        LeftLeg: {
          Health: {
            Current: utility.getRandomInt(healthObj.BodyParts.LeftLeg.min, healthObj.BodyParts.LeftLeg.max),
            Maximum: healthObj.BodyParts.LeftLeg.max,
          },
        },
        RightLeg: {
          Health: {
            Current: utility.getRandomInt(healthObj.BodyParts.RightLeg.min, healthObj.BodyParts.RightLeg.max),
            Maximum: healthObj.BodyParts.RightLeg.max,
          },
        },
      },
      UpdateTime: 1625165184,
    };
  }

  generateDogtag(bot) {
    bot.Inventory.items.push({
      _id: utility.generateNewItemId(),
      _tpl: bot.Info.Side === "Usec" ? "59f32c3b86f77472a31742f0" : "59f32bb586f774757e1e8442",
      parentId: bot.Inventory.equipment,
      slotId: "Dogtag",
      upd: {
        Dogtag: {
          AccountId: bot.aid,
          ProfileId: bot._id,
          Nickname: bot.Info.Nickname,
          Side: bot.Info.Side,
          Level: bot.Info.Level,
          Time: new Date().toISOString(),
          Status: "Killed by ",
          KillerAccountId: "Unknown",
          KillerProfileId: "Unknown",
          KillerName: "Unknown",
          WeaponName: "Unknown",
        },
      },
    });

    return bot;
  }
}

const EquipmentSlots = {
  Headwear: "Headwear",
  Earpiece: "Earpiece",
  FaceCover: "FaceCover",
  ArmorVest: "ArmorVest",
  Eyewear: "Eyewear",
  ArmBand: "ArmBand",
  TacticalVest: "TacticalVest",
  Pockets: "Pockets",
  Backpack: "Backpack",
  SecuredContainer: "SecuredContainer",
  FirstPrimaryWeapon: "FirstPrimaryWeapon",
  SecondPrimaryWeapon: "SecondPrimaryWeapon",
  Holster: "Holster",
  Scabbard: "Scabbard",
};

class Generator {
  constructor() {
    this.inventory = {};
  }

  generateInventory(templateInventory, equipmentChances, generation, botRole) {
    // Generate base inventory with no items
    this.inventory = BotGenerator.generateInventoryBase();

    // Go over all defined equipment slots and generate an item for each of them
    const excludedSlots = [EquipmentSlots.FirstPrimaryWeapon, EquipmentSlots.SecondPrimaryWeapon, EquipmentSlots.Holster, EquipmentSlots.ArmorVest];

    for (const equipmentSlot in templateInventory.equipment) {
      // Weapons have special generation and will be generated seperately; ArmorVest should be generated after TactivalVest
      if (excludedSlots.includes(equipmentSlot)) {
        continue;
      }
      BotGenerator.generateEquipment(equipmentSlot, templateInventory.equipment[equipmentSlot], templateInventory.mods, equipmentChances, botRole);
    }

    // ArmorVest is generated afterwards to ensure that TacticalVest is always first, in case it is incompatible
    BotGenerator.generateEquipment(EquipmentSlots.ArmorVest, templateInventory.equipment.ArmorVest, templateInventory.mods, equipmentChances, botRole);

    // Roll weapon spawns and generate a weapon for each roll that passed
    const shouldSpawnPrimary = utility.getRandomIntEx(100) <= equipmentChances.equipment.FirstPrimaryWeapon;
    const weaponSpawns = [
      {
        slot: EquipmentSlots.FirstPrimaryWeapon,
        shouldSpawn: shouldSpawnPrimary,
      },
      {
        // Only roll for a chance at secondary if primary roll was successful
        slot: EquipmentSlots.SecondPrimaryWeapon,
        shouldSpawn: shouldSpawnPrimary ? utility.getRandomIntEx(100) <= equipmentChances.equipment.SecondPrimaryWeapon : false,
      },
      {
        // Roll for an extra pistol, unless primary roll failed - in that case, pistol is guaranteed
        slot: EquipmentSlots.Holster,
        shouldSpawn: shouldSpawnPrimary ? utility.getRandomIntEx(100) <= equipmentChances.equipment.Holster : true,
      },
    ];

    for (const weaponSpawn of weaponSpawns) {
      if (weaponSpawn.shouldSpawn && templateInventory.equipment[weaponSpawn.slot].length) {
        BotGenerator.generateWeapon(
          weaponSpawn.slot,
          templateInventory.equipment[weaponSpawn.slot],
          templateInventory.mods,
          equipmentChances.mods,
          generation.items.magazines,
          botRole
        );
      }
    }

    BotGenerator.generateLoot(templateInventory.items, generation.items);

    return utility.DeepCopy(this.inventory);
  }

  generateInventoryBase() {
    const equipmentId = utility.generateNewId(undefined, 3);
    const equipmentTpl = "55d7217a4bdc2d86028b456d";

    const stashId = utility.generateNewId(undefined, 3);
    const stashTpl = "566abbc34bdc2d92178b4576";

    const questRaidItemsId = utility.generateNewId(undefined, 3);
    const questRaidItemsTpl = "5963866286f7747bf429b572";

    const questStashItemsId = utility.generateNewId(undefined, 3);
    const questStashItemsTpl = "5963866b86f7747bfa1c4462";

    const sortingTableId = utility.generateNewId(undefined, 3);
    const sortingTableTpl = "602543c13fee350cd564d032";

    return {
      items: [
        {
          _id: equipmentId,
          _tpl: equipmentTpl,
        },
        {
          _id: stashId,
          _tpl: stashTpl,
        },
        {
          _id: questRaidItemsId,
          _tpl: questRaidItemsTpl,
        },
        {
          _id: questStashItemsId,
          _tpl: questStashItemsTpl,
        },
        {
          _id: sortingTableId,
          _tpl: sortingTableTpl
        }
      ],
      equipment: equipmentId,
      stash: stashId,
      questRaidItems: questRaidItemsId,
      questStashItems: questStashItemsId,
      sortingTable: sortingTableId,
      fastPanel: {},
    };
  }

  generateEquipment(equipmentSlot, equipmentPool, modPool, spawnChances, botRole) {

    // const p1 = performance.now();

    const spawnChance = [EquipmentSlots.Pockets, EquipmentSlots.SecuredContainer].includes(equipmentSlot) ? 100 : spawnChances.equipment[equipmentSlot];
    if (typeof spawnChance === "undefined") {
      logger.logWarning(`No spawn chance was defined for ${equipmentSlot}`);
      return;
    }

    const shouldSpawn = utility.getRandomIntEx(100) <= spawnChance;
    if (equipmentPool.length && shouldSpawn) {
      const id = utility.generateNewItemId();
      const tpl = utility.getArrayValue(equipmentPool);
      const itemTemplate = utility.DeepCopy(global._database.items[tpl]);

      if (!itemTemplate) {
        logger.logError(`Could not find item template with tpl ${tpl}`);
        logger.logError(`EquipmentSlot -> ${equipmentSlot}`);
        return;
      }

      if (BotGenerator.isItemIncompatibleWithCurrentItems(this.inventory.items, tpl, equipmentSlot)) {
        // Bad luck - randomly picked item was not compatible with current gear
        return;
      }

      const item = {
        _id: id,
        _tpl: tpl,
        parentId: this.inventory.equipment,
        slotId: equipmentSlot,
        ...BotGenerator.generateExtraPropertiesForItem(itemTemplate, botRole),
      };

      if (Object.keys(modPool).includes(tpl)) {
        const items = BotGenerator.generateModsForItem([item], modPool, id, itemTemplate, spawnChances.mods);
        this.inventory.items.push(...items);
      } else {
        this.inventory.items.push(item);
      }
    }

    // const p2 = performance.now();
    // console.log(`generateEquipment(${equipmentSlot},${equipmentPool},${modPool},${spawnChances},${botRole}) ${p2 - p1} ms`)
  }

  generateWeapon(equipmentSlot, weaponPool, modPool, modChances, magCounts, botRole) {
    const id = utility.generateNewItemId();
    const tpl = utility.getArrayValue(weaponPool);
    const itemTemplate = utility.DeepCopy(global._database.items[tpl]);

    if (!itemTemplate) {
      logger.logError(`Could not find item template with tpl ${tpl}`);
      logger.logError(`WeaponSlot -> ${equipmentSlot}`);
      return;
    }

    let weaponMods = [
      {
        _id: id,
        _tpl: tpl,
        parentId: this.inventory.equipment,
        slotId: equipmentSlot,
        ...BotGenerator.generateExtraPropertiesForItem(itemTemplate, botRole),
      },
    ];

    if (Object.keys(modPool).includes(tpl)) {
      weaponMods = BotGenerator.generateModsForItem(weaponMods, modPool, id, itemTemplate, modChances);
    }

    if (!BotGenerator.isWeaponValid(weaponMods)) {
      // Invalid weapon generated, fallback to preset
      logger.logWarning(`Weapon ${tpl} was generated incorrectly, see error above`);
      weaponMods = [];

      // TODO: Right now, preset weapons trigger a lot of warnings regarding missing ammo in magazines & such
      let preset;
      for (const [presetId, presetObj] of Object.entries(global._database.globals.ItemPresets)) {
        if (presetObj._items[0]._tpl === tpl) {
          preset = presetObj;
          break;
        }
      }

      if (preset) {
        const parentItem = preset._items[0];
        preset._items[0] = {
          ...parentItem,
          ...{
            parentId: this.inventory.equipment,
            slotId: equipmentSlot,
            ...BotGenerator.generateExtraPropertiesForItem(itemTemplate),
          },
        };
        weaponMods.push(...preset._items);
      } else {
        logger.logError(`Could not find preset for weapon with tpl ${tpl}`);
        return;
      }
    }

    // Find ammo to use when filling magazines
    const ammoTpl = BotGenerator.getCompatibleAmmo(weaponMods, itemTemplate);

    // Fill existing magazines to full and sync ammo type
    for (const mod of weaponMods.filter((mod) => mod.slotId === "mod_magazine")) {
      BotGenerator.fillExistingMagazines(weaponMods, mod, ammoTpl);
    }

    this.inventory.items.push(...weaponMods);

    // Generate extra magazines and attempt add them to TacticalVest or Pockets
    BotGenerator.generateExtraMagazines(weaponMods, itemTemplate, magCounts, ammoTpl);
  }

  generateModsForItem(items, modPool, parentId, parentTemplate, modSpawnChances) {
    const itemModPool = modPool[parentTemplate._id];

    if (!parentTemplate._props.Slots.length && !parentTemplate._props.Cartridges.length && !parentTemplate._props.Chambers.length) {
      logger.logError(`Item ${parentTemplate._id} had mods defined, but no slots to support them`);
      return items;
    }

    for (const modSlot in itemModPool) {
      let itemSlot;
      switch (modSlot) {
        case "patron_in_weapon":
          // TODO: can cause a bug of Big Guns!!!
          itemSlot = parentTemplate._props.Chambers.find((c) => c._name === modSlot);
          break;
        case "cartridges":
          itemSlot = parentTemplate._props.Cartridges.find((c) => c._name === modSlot);
          break;
        default:
          itemSlot = parentTemplate._props.Slots.find((s) => s._name === modSlot);
          break;
      }

      if (!itemSlot) {
        logger.logError(`Slot '${modSlot}' does not exist for item ${parentTemplate._id}`);
        continue;
      }

      const modSpawnChance = itemSlot._required || ["mod_magazine", "patron_in_weapon", "cartridges"].includes(modSlot) ? 100 : modSpawnChances[modSlot];
      if (utility.getRandomIntEx(100) > modSpawnChance) {
        continue;
      }

      const exhaustableModPool = new ExhaustableArray(itemModPool[modSlot]);

      let modTpl;
      let found = false;
      while (exhaustableModPool.hasValues()) {
        modTpl = exhaustableModPool.getRandomValue();
        if (!BotGenerator.isItemIncompatibleWithCurrentItems(items, modTpl, modSlot)) {
          found = true;
          break;
        }
      }

      if (!found || !modTpl) {
        if (itemSlot._required) {
          logger.logWarning(`Could not locate any compatible items to fill '${modSlot}' for ${parentTemplate._id}`);
        }
        continue;
      }

      if (!itemSlot._props.filters[0].Filter.includes(modTpl)) {
        logger.logWarning(`Mod ${modTpl} is not compatible with slot '${modSlot}' for item ${parentTemplate._id}`);
        continue;
      }

      const modTemplate = utility.DeepCopy(global._database.items[modTpl]);
      if (!modTemplate) {
        logger.logWarning(`Could not find mod item template with tpl ${modTpl}`);
        logger.logInfo(`Item -> ${parentTemplate._id}; Slot -> ${modSlot}`);
        continue;
      }

      const modId = utility.generateNewItemId();
      items.push({
        _id: modId,
        _tpl: modTpl,
        parentId: parentId,
        slotId: modSlot,
        ...BotGenerator.generateExtraPropertiesForItem(modTemplate),
      });

      if (Object.keys(modPool).includes(modTpl)) {
        BotGenerator.generateModsForItem(items, modPool, modId, modTemplate, modSpawnChances);
      }
    }

    return items;
  }

  generateExtraPropertiesForItem(itemTemplate, botRole = null) {

    let properties = {};
    const itemProperties = itemTemplate._props;
    let durabilityType;
    let maxDurability;
    let currentDurability;

    if (itemProperties.hasOwnProperty("weapClass")) {
      durabilityType = helper_f.getDurabilityType(itemTemplate)

      maxDurability = helper_f.getRandomisedMaxDurability(itemTemplate, botRole);
      currentDurability = helper_f.getRandomisedMinDurability(maxDurability, botRole);

      properties.Repairable = {
        Durability: currentDurability,
        MaxDurability: maxDurability
      };
    } else if (itemProperties.hasOwnProperty("armorClass")) {
      durabilityType = helper_f.getDurabilityType(itemTemplate)

      maxDurability = helper_f.getRandomisedMaxDurability(itemTemplate, botRole);
      currentDurability = helper_f.getRandomisedMinDurability(maxDurability, botRole);

      properties.Repairable = {
        Durability: currentDurability,
        MaxDurability: maxDurability
      };
    }

    if (itemProperties.HasHinge) {
      properties.Togglable = { On: true };
    }

    if (itemProperties.Foldable) {
      properties.Foldable = { Folded: false };
    }

    //if item can be a stack higher than 1 | CQ: this fixes money spawning in stacks of 1, and whatever else.
    if (itemProperties.StackMaxSize > 1) {
      //if item has random stacks properties
      if (itemProperties.StackMaxRandom && itemProperties.StackMinRandom) {
        properties.StackObjectsCount = utility.getRandomInt(itemProperties.StackMinRandom, itemProperties.StackMaxRandom);
      } else {
        //if it doesn't, randomize it between 1 and the stack max size
        properties.StackObjectsCount = utility.getRandomInt(1, itemProperties.StackMaxSize);
      }
    }

    if (itemProperties.weapFireType && itemProperties.weapFireType.length) {
      properties.FireMode = { FireMode: itemProperties.weapFireType[0] };
    }

    if (itemProperties.MaxHpResource) {
      properties.MedKit = { HpResource: itemProperties.MaxHpResource };
    }

    if (itemProperties.MaxResource && itemProperties.foodUseTime) {
      properties.FoodDrink = { HpPercent: itemProperties.MaxResource };
    }

    return Object.keys(properties).length ? { upd: properties } : {};
  }

  isItemIncompatibleWithCurrentItems(items, tplToCheck, equipmentSlot) {
    // TODO: Can probably be optimized to cache itemTemplates as items are added to inventory
    const itemTemplates = items.map((i) => global._database.items[i._tpl]);
    const templateToCheck = utility.DeepCopy(global._database.items[tplToCheck]);

    // Check if any of the current inventory templates have the incoming item defined as incompatible
    const currentInventoryCheck = itemTemplates.some((item) => item._props[`Blocks${equipmentSlot}`] || item._props.ConflictingItems.includes(tplToCheck));
    // Check if the incoming item has any inventory items defined as incompatible
    const itemCheck = items.some(
      (item) => templateToCheck && templateToCheck._props && (templateToCheck._props[`Blocks${item.slotId}`] || templateToCheck._props.ConflictingItems.includes(item._tpl))
    );

    return currentInventoryCheck || itemCheck;
  }

  /** Checks if all required slots are occupied on a weapon and all it's mods */
  isWeaponValid(itemList) {
    for (const item of itemList) {
      const template = global._database.items[item._tpl];
      if (template._type != "Item") continue;
      if (!template._props.Slots || !template._props.Slots.length) {
        continue;
      }

      for (const slot of template._props.Slots) {
        if (!slot._required) {
          continue;
        }

        const slotItem = itemList.find((i) => i.parentId === item._id && i.slotId === slot._name);
        if (!slotItem) {
          logger.logError(`Required slot '${slot._name}' on ${template._id} was empty`);
          return false;
        }
      }
    }

    return true;
  }

  /** Generates extra magazines or bullets (if magazine is internal) and adds them to TacticalVest and Pockets.
   * Additionally, adds extra bullets to SecuredContainer */
  generateExtraMagazines(weaponMods, weaponTemplate, magCounts, ammoTpl) {
    let magazineTpl = "";
    const magazine = weaponMods.find((m) => m.slotId === "mod_magazine");
    if (!magazine) {
      logger.logWarning(`Generated weapon with tpl ${weaponTemplate._id} had no magazine`);
      magazineTpl = weaponTemplate._props.defMagType;
    } else {
      magazineTpl = magazine._tpl;
    }

    let magTemplate = global._database.items[magazineTpl];
    if (!magTemplate) {
      logger.logError(`Could not find magazine template with tpl ${magazineTpl}`);
      return;
    }

    const range = magCounts.max - magCounts.min;
    const count = BotGenerator.getBiasedRandomNumber(magCounts.min, magCounts.max, ~~(range * 0.75), 4);

    if (magTemplate._props.ReloadMagType === "InternalMagazine") {
      /* Get the amount of bullets that would fit in the internal magazine
       * and multiply by how many magazines were supposed to be created */
      const bulletCount = magTemplate._props.Cartridges[0]._max_count * count;

      BotGenerator.addBullets(ammoTpl, bulletCount);
    } else if (weaponTemplate._props.ReloadMode === "OnlyBarrel") {
      const bulletCount = count;

      BotGenerator.addBullets(ammoTpl, bulletCount);
    } else {
      for (let i = 0; i < count; i++) {
        const magId = utility.generateNewItemId();
        const magWithAmmo = [
          {
            _id: magId,
            _tpl: magazineTpl,
          },
          {
            _id: utility.generateNewItemId(),
            _tpl: ammoTpl,
            parentId: magId,
            slotId: "cartridges",
            upd: { StackObjectsCount: magTemplate._props.Cartridges[0]._max_count },
          },
        ];

        const success = BotGenerator.addItemWithChildrenToEquipmentSlot([EquipmentSlots.TacticalVest, EquipmentSlots.Pockets], magId, magazineTpl, magWithAmmo);

        if (!success && i < magCounts.min) {
          /* We were unable to fit at least the minimum amount of magazines,
           * so we fallback to default magazine and try again.
           * Temporary workaround to Killa spawning with no extras if he spawns with a drum mag */

          if (magazineTpl === weaponTemplate._props.defMagType) {
            // We were already on default - stop here to prevent infinite looping
            break;
          }

          magazineTpl = weaponTemplate._props.defMagType;
          magTemplate = global._database.items[magazineTpl];
          if (!magTemplate) {
            logger.logError(`Could not find magazine template with tpl ${magazineTpl}`);
            break;
          }

          if (magTemplate._props.ReloadMagType === "InternalMagazine") {
            break;
          }

          i--;
        }
      }
    }

    const ammoTemplate = utility.DeepCopy(global._database.items[ammoTpl]);
    if (!ammoTemplate) {
      logger.logError(`Could not find ammo template with tpl ${ammoTpl}`);
      return;
    }

    // Add 4 stacks of bullets to SecuredContainer
    for (let i = 0; i < 4; i++) {
      const id = utility.generateNewItemId();
      BotGenerator.addItemWithChildrenToEquipmentSlot([EquipmentSlots.SecuredContainer], id, ammoTpl, [
        {
          _id: id,
          _tpl: ammoTpl,
          upd: { StackObjectsCount: ammoTemplate._props.StackMaxSize },
        },
      ]);
    }
  }

  addBullets(ammoTpl, bulletCount) {
    const ammoItems = utility.splitStack({
      _id: utility.generateNewItemId(),
      _tpl: ammoTpl,
      upd: { StackObjectsCount: bulletCount },
    });

    for (const ammoItem of ammoItems) {
      BotGenerator.addItemWithChildrenToEquipmentSlot([EquipmentSlots.TacticalVest, EquipmentSlots.Pockets], ammoItem._id, ammoItem._tpl, [ammoItem]);
    }
  }

  /** Finds and returns tpl of ammo that should be used, while making sure it's compatible */
  getCompatibleAmmo(weaponMods, weaponTemplate) {
    let ammoTpl = "";
    let ammoToUse = weaponMods.find((mod) => mod.slotId === "patron_in_weapon");
    if (!ammoToUse) {
      // No bullet found in chamber, search for ammo in magazines instead
      ammoToUse = weaponMods.find((mod) => mod.slotId === "cartridges");
      if (!ammoToUse) {
        // Still could not locate ammo to use? Fallback to weapon default
        logger.logWarning(`Could not locate ammo to use for ${weaponTemplate._id}, falling back to default -> ${weaponTemplate._props.defAmmo}`);
        // Immediatelly returns, as default ammo is guaranteed to be compatible
        return weaponTemplate._props.defAmmo;
      } else {
        ammoTpl = ammoToUse._tpl;
      }
    } else {
      ammoTpl = ammoToUse._tpl;
    }

    if (weaponTemplate._props.Chambers[0] && !weaponTemplate._props.Chambers[0]._props.filters[0].Filter.includes(ammoToUse._tpl)) {
      // Incompatible ammo was found, return default (can happen with .366 and 7.62x39 weapons)
      return weaponTemplate._props.defAmmo;
    }

    return ammoTpl;
  }

  /** Fill existing magazines to full, while replacing their contents with specified ammo */
  fillExistingMagazines(weaponMods, magazine, ammoTpl) {
    const modTemplate = utility.DeepCopy(global._database.items[magazine._tpl]);
    if (!modTemplate) {
      logger.logError(`Could not find magazine template with tpl ${magazine._tpl}`);
      return;
    }

    const stackSize = modTemplate._props.Cartridges[0]._max_count;
    const cartridges = weaponMods.find((m) => m.parentId === magazine._id && m.slotId === "cartridges");

    if (!cartridges) {
      logger.logWarning(`Magazine with tpl ${magazine._tpl} had no ammo`);
      weaponMods.push({
        _id: utility.generateNewItemId(),
        _tpl: ammoTpl,
        parentId: magazine._id,
        slotId: "cartridges",
        location: 0,
        upd: { StackObjectsCount: stackSize },
      });
    } else {
      cartridges._id = utility.generateNewItemId();
      cartridges._tpl = ammoTpl;
      cartridges.upd = { StackObjectsCount: stackSize };
    }
  }

  generateLoot(lootPool, itemCounts) {
    // Flatten all individual slot loot pools into one big pool, while filtering out potentially missing templates
    let lootTemplates = [];
    for (const [slot, pool] of Object.entries(lootPool)) {
      if (!pool || !pool.length) {
        continue;
      }
      const poolItems = pool.map((lootTpl) => global._database.items[lootTpl]);
      lootTemplates.push(...poolItems.filter((x) => !!x));
    }

    // Sort all items by their worth to spawn chance ratio
    lootTemplates.sort((a, b) => BotGenerator.compareByValue(a, b));

    // Get all healing items
    const healingItems = lootTemplates.filter((template) => "medUseTime" in template._props);

    // Get all grenades
    const grenadeItems = lootTemplates.filter((template) => "ThrowType" in template._props);

    // Get all misc loot items (excluding magazines, bullets, grenades and healing items)
    const lootItems = lootTemplates.filter(
      (template) => !("ammoType" in template._props) && !("ReloadMagType" in template._props) && !("medUseTime" in template._props) && !("ThrowType" in template._props)
    );

    let range = itemCounts.healing.max - itemCounts.healing.min;
    const healingItemCount = BotGenerator.getBiasedRandomNumber(itemCounts.healing.min, itemCounts.healing.max, range, 3);

    range = itemCounts.looseLoot.max - itemCounts.looseLoot.min;
    const lootItemCount = BotGenerator.getBiasedRandomNumber(itemCounts.looseLoot.min, itemCounts.looseLoot.max, range, 5);

    range = itemCounts.grenades.max - itemCounts.grenades.min;
    const grenadeCount = BotGenerator.getBiasedRandomNumber(itemCounts.grenades.min, itemCounts.grenades.max, range, 4);

    // handle specialItems uniquely because of bandaid and bc JET didn't bother implementing...
    let specialLoot = [];
    if (lootPool.SpecialLoot && lootPool.SpecialLoot.length > 0) {
      // if bot has SpecialLoot
      if (itemCounts.specialItems && itemCounts.specialItems.max > 0) {
        //if specialItems exists
        let randomAmount = utility.getRandomInt(itemCounts.specialItems.min, itemCounts.specialItems.max);
        for (let i = 0; i < randomAmount; i++) {
          //pull a random item from the array
          let randomIndex = utility.getRandomInt(0, lootPool.SpecialLoot.length); //this can generate duplicates but w/e
          let itemID = lootPool.SpecialLoot[randomIndex];
          let item = utility.DeepCopy(global._database.items[itemID]);

          //in case the ID doesn't exist, which would cause the item to be null
          if (item) {
            specialLoot.push(item);
            //logger.logError(`Pushed. RAm: ${randomAmount}, RIn: ${randomIndex}, iID: ${itemID}`);
          }
        }
      }
      //logger.logError(JSON.stringify(specialLoot, null, 2));
      if (specialLoot.length > 0) {
        //only add loot if any was generated.
        BotGenerator.addLootFromPool(specialLoot, [EquipmentSlots.Pockets], specialLoot.length); //we handled amount earlier, so no need to count
      }
    }

    BotGenerator.addLootFromPool(healingItems, [EquipmentSlots.TacticalVest, EquipmentSlots.Pockets], healingItemCount);
    BotGenerator.addLootFromPool(lootItems, [EquipmentSlots.Backpack, EquipmentSlots.Pockets, EquipmentSlots.TacticalVest], lootItemCount);
    BotGenerator.addLootFromPool(grenadeItems, [EquipmentSlots.TacticalVest, EquipmentSlots.Pockets], grenadeCount);
  }

  addLootFromPool(pool, equipmentSlots, count) {
    if (pool.length) {
      for (let i = 0; i < count; i++) {
        const itemIndex = BotGenerator.getBiasedRandomNumber(0, pool.length - 1, pool.length - 1, 3);
        const itemTemplate = pool[itemIndex];
        const id = utility.generateNewItemId();

        const itemsToAdd = [
          {
            _id: id,
            _tpl: itemTemplate._id,
            ...BotGenerator.generateExtraPropertiesForItem(itemTemplate),
          },
        ];

        // Fill ammo box
        if (itemTemplate._props.StackSlots && itemTemplate._props.StackSlots.length) {
          itemsToAdd.push({
            _id: utility.generateNewItemId(),
            _tpl: itemTemplate._props.StackSlots[0]._props.filters[0].Filter[0],
            parentId: id,
            slotId: "cartridges",
            upd: { StackObjectsCount: itemTemplate._props.StackMaxRandom },
          });
        }

        BotGenerator.addItemWithChildrenToEquipmentSlot(equipmentSlots, id, itemTemplate._id, itemsToAdd);
      }
    }
  }

  /** Adds an item with all its childern into specified equipmentSlots, wherever it fits.
   * Returns a `boolean` indicating success. */
  addItemWithChildrenToEquipmentSlot(equipmentSlots, parentId, parentTpl, itemWithChildren) {
    for (const slot of equipmentSlots) {
      const container = this.inventory.items.find((i) => i.slotId === slot);
      if (!container) {
        continue;
      }

      const containerTemplate = global._database.items[container._tpl];
      if (!containerTemplate) {
        logger.logError(`Could not find container template with tpl ${container._tpl}`);
        continue;
      }

      if (!containerTemplate._props.Grids || !containerTemplate._props.Grids.length) {
        // Container has no slots to hold items
        continue;
      }

      const itemSize = helper_f.getItemSize(parentTpl, parentId, itemWithChildren);

      for (const slot of containerTemplate._props.Grids) {
        const containerItems = this.inventory.items.filter((i) => i.parentId === container._id && i.slotId === slot._name);
        const slotMap = helper_f.getContainerMap(slot._props.cellsH, slot._props.cellsV, containerItems, container._id);
        const findSlotResult = helper_f.findSlotForItem(slotMap, itemSize[0], itemSize[1]);

        if (findSlotResult.success) {
          const parentItem = itemWithChildren.find((i) => i._id === parentId);
          parentItem.parentId = container._id;
          parentItem.slotId = slot._name;
          parentItem.location = {
            x: findSlotResult.x,
            y: findSlotResult.y,
            r: findSlotResult.rotation ? 1 : 0,
          };
          this.inventory.items.push(...itemWithChildren);
          return true;
        }
      }
    }

    return false;
  }

  getBiasedRandomNumber(min, max, shift, n) {
    /* To whoever tries to make sense of this, please forgive me - I tried my best at explaining what goes on here.
     * This function generates a random number based on a gaussian distribution with an option to add a bias via shifting.
     *
     * Here's an example graph of how the probabilities can be distributed:
     * https://www.boost.org/doc/libs/1_49_0/libs/math/doc/sf_and_dist/graphs/normal_pdf.png
     * Our parameter 'n' is sort of like σ (sigma) in the example graph.
     *
     * An 'n' of 1 means all values are equally likely. Increasing 'n' causes numbers near the edge to become less likely.
     * By setting 'shift' to whatever 'max' is, we can make values near 'min' very likely, while values near 'max' become extremely unlikely.
     *
     * Here's a place where you can play around with the 'n' and 'shift' values to see how the distribution changes:
     * http://jsfiddle.net/e08cumyx/ */

    if (max < min) {
      throw {
        name: "Invalid arguments",
        message: `Bounded random number generation max is smaller than min (${max} < ${min})`,
      };
    }

    if (n < 1) {
      throw {
        name: "Invalid argument",
        message: `'n' must be 1 or greater (received ${n})`,
      };
    }

    if (min === max) {
      return min;
    }

    if (shift > max - min) {
      /* If a rolled number is out of bounds (due to bias being applied), we simply roll it again.
       * As the shifting increases, the chance of rolling a number within bounds decreases.
       * A shift that is equal to the available range only has a 50% chance of rolling correctly, theoretically halving performance.
       * Shifting even further drops the success chance very rapidly - so we want to warn against that */

      logger.logWarning("Bias shift for random number generation is greater than the range of available numbers.\nThis can have a very severe performance impact!");
      logger.logInfo(`min -> ${min}; max -> ${max}; shift -> ${shift}`);
    }

    const gaussianRandom = (n) => {
      let rand = 0;

      for (let i = 0; i < n; i += 1) {
        rand += Math.random();
      }

      return rand / n;
    };

    const boundedGaussian = (start, end, n) => {
      return ~~(start + gaussianRandom(n) * (end - start + 1));
    };

    const biasedMin = shift >= 0 ? min - shift : min;
    const biasedMax = shift < 0 ? max + shift : max;

    let num;
    do {
      num = boundedGaussian(biasedMin, biasedMax, n);
    } while (num < min || num > max);

    return num;
  }

  /** Compares two item templates by their price to spawn chance ratio */
  compareByValue(a, b) {
    // If an item has no price or spawn chance, it should be moved to the back when sorting
    const priceA = _database.itemPriceTable[a._id];
    if (!priceA || !a._props.LootExperience) {
      return 1;
    }

    const priceB = _database.itemPriceTable[b._id];
    if (!priceB || !b._props.LootExperience) {
      return -1;
    }
    const spawnChanceA = utility.valueBetween(a._props.LootExperience, 0, 250, 0, 100)
    const spawnChanceB = utility.valueBetween(b._props.LootExperience, 0, 250, 0, 100)

    const worthA = priceA / spawnChanceA;
    const worthB = priceB / spawnChanceB;

    if (worthA < worthB) {
      return -1;
    }

    if (worthA > worthB) {
      return 1;
    }

    return 0;
  }
}

class ExhaustableArray {
  constructor(itemPool) {
    this.pool = utility.DeepCopy(itemPool);
  }

  getRandomValue() {
    if (!this.pool || !this.pool.length) {
      return null;
    }

    const index = utility.getRandomInt(0, this.pool.length - 1);
    const toReturn = utility.DeepCopy(this.pool[index]);
    this.pool.splice(index, 1);
    return toReturn;
  }

  hasValues() {
    if (this.pool && this.pool.length) {
      return true;
    }

    return false;
  }
}

const BotGenerator = new Generator();
var controller = new BotsController();
module.exports.botHandler = controller;
module.exports.generate = controller.generate;
module.exports.getBotLimit = controller.getBotLimit;
module.exports.getBotDifficulty = controller.getBotDifficulty;
module.exports.generatePlayerScav = controller.generatePlayerScav;
module.exports.generator = BotGenerator;
module.exports.BotGenerator = BotGenerator;
