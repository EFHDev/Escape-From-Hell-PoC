const { ConfigController } = require('./ConfigController');
const { ItemController } = require('./ItemController');
const fs = require('fs');
const utility = require('./../../core/util/utility');
const e = require('express');
const mathjs = require('mathjs');
const { DatabaseController } = require('./DatabaseController');
const { logger } = require('../../core/util/logger');

/**
 * 
 */
class LootController 
{
  /**
   * DO NOT USE - Created via Loot generation
   */
    static LootRarities = {};
    /**
     * 
     */
    static LocationLootChanceModifierFromFile = 1.0;
    /**
     * 
     */
    static LootModifiers = {
        modifierSuperRare: 0,
        modifierRare: 0,
        modifierUnCommon: 0,
        modifierCommon: 0,
    };

    /**
     * DO NOT USE - Only for Loot generation
     */
    static PreviouslyGeneratedItems = [];

    /**
     * DO NOT USE - Only for Loot generation
     */
    static PreviouslyGeneratedContainers = [];

    /**
     * 
     * @returns {object} Loot Modifiers
     */
    static GetLootModifiers() 
    {
        if(LootController.LootModifiers.modifierSuperRare !== 0) {
            return LootController.LootModifiers;
        }

        // let modifierSuperRare = global._database.gameplayConfig.locationloot.RarityMultipliers.Superrare;
        let modifierSuperRare = ConfigController.Configs["gameplay"].locationloot.RarityMultipliers.Superrare;
        if(modifierSuperRare == undefined){
            modifierSuperRare = 0.5;
            logger.logWarning("Loot Modifier: Superrare: Couldn't find the config. Reset to 0.5.")
        }
        let modifierRare = ConfigController.Configs["gameplay"].locationloot.RarityMultipliers.Rare;
        if(modifierRare == undefined){
            modifierRare = 0.6;
            logger.logWarning("Loot Modifier: Rare: Couldn't find the config. Reset to 0.9.")
        }
        let modifierUnCommon = ConfigController.Configs["gameplay"].locationloot.RarityMultipliers.Uncommon;
        if(modifierUnCommon == undefined){
            modifierUnCommon = 0.85;
            logger.logWarning("Loot Modifier: Uncommon: Couldn't find the config. Reset to 0.95.")
        }
        let modifierCommon = ConfigController.Configs["gameplay"].locationloot.RarityMultipliers.Common;
        if(modifierCommon == undefined){
            modifierCommon = 0.95;
            logger.logWarning("Loot Modifier: Common: Couldn't find the config. Reset to 0.95.")
        }
        // logger.logInfo("Loot Modifier: Location: " + LootController.LocationLootChanceModifierFromFile);
        // logger.logInfo("Loot Modifier: Superrare: " + modifierSuperRare);
        // logger.logInfo("Loot Modifier: Rare: " + modifierRare);
        // logger.logInfo("Loot Modifier: UnCommon: " + modifierUnCommon);
        // logger.logInfo("Loot Modifier: Common: " + modifierCommon);
        
        // ----------------------------------------------------------------------------------------
        // Paulo: Cough, Cough, modify these lower as people are too stupid to change it themselves
        modifierSuperRare *= (0.02 * LootController.LocationLootChanceModifierFromFile);
        modifierRare *= (0.05 * LootController.LocationLootChanceModifierFromFile);
        modifierUnCommon *= (0.15 * LootController.LocationLootChanceModifierFromFile);
        modifierCommon *= (0.5 * LootController.LocationLootChanceModifierFromFile);
        
        LootController.LootModifiers.modifierSuperRare = modifierSuperRare;
        LootController.LootModifiers.modifierRare = modifierRare;
        LootController.LootModifiers.modifierUnCommon = modifierUnCommon;
        LootController.LootModifiers.modifierCommon = modifierCommon;
        return LootController.LootModifiers;
    }

    /**
     * Calculates the Rarity of an item
     * @param {string} itemTemplate 
     * @returns {string} type of rarity this item falls into, i.e. Common -> Superrare
     */
    static GetItemRarityType(itemTemplate) {

      let localeTempl = DatabaseController.getDatabase().locales.global.en.templates[itemTemplate._id].Name;
      if(!localeTempl || localeTempl == "undefined" || localeTempl == null || localeTempl === "")
        localeTempl = itemTemplate._props.Name;

        if(LootController.LootRarities[localeTempl] === undefined) {
      
          const backgroundColor = itemTemplate._props.BackgroundColor;
          const itemExperience = itemTemplate._props.LootExperience < 10 ? 10 : itemTemplate._props.LootExperience;
          const examineExperience = itemTemplate._props.ExamineExperience < 10 ? 10 : itemTemplate._props.ExamineExperience;
          const unlootable = itemTemplate._props.Unlootable;
      
          let itemRarityType = "COMMON";
          //const itemName = itemTemplate._props !== undefined && typeof(itemTemplate._props.Name) === "string" ? itemTemplate._props.Name : "";
      
          let item_price = ItemController.getTemplatePrice(itemTemplate._id);
          if(itemTemplate._props.ammoType !== undefined) {
            item_price = item_price * 310 * itemTemplate._props.StackMaxSize;
          }
          // If Money
          if(ItemController.isMoney(itemTemplate._id)) {
            item_price = (item_price * 6100);
          }

          let itemCalculation = 
            ((itemExperience + examineExperience + (backgroundColor == "violet" || backgroundColor == "blue" ? 20 : 10)) * 1000)
              + (item_price * 0.01); 

          // if ammo_box
          if(itemTemplate._props.Name !== undefined && itemTemplate._props.Name.includes("ammo_box")) {
            itemCalculation *= 1.75;
          }
          // If weapon part / mod
          if(itemTemplate._props.ItemSound !== undefined && itemTemplate._props.ItemSound.includes("mod")) {
            itemCalculation *= 1.5;
          }
          if(backgroundColor === "blue") {
            itemCalculation *= 2.09;
          }
          
          itemCalculation = Math.round(itemCalculation / 10000);
          itemCalculation -= 2;

          itemCalculation = Math.min(10, itemCalculation);
          itemCalculation = Math.max(1, itemCalculation);
          // console.log(itemTemplate._props.Name);
          // console.log(itemCalculation);

          try {
            if(unlootable) {
              itemRarityType = "NOT_EXIST";
            }
            else {
              if (itemCalculation >= 9) {
                  itemRarityType = "SUPERRARE";
              } else if (itemCalculation >= 5) {
                  itemRarityType = "RARE";
              } else if (itemCalculation >= 3) {
                  itemRarityType = "UNCOMMON";
              }
            }
          } catch(err) {
            itemRarityType = "SUPERRARE";
          }
      
          LootController.LootRarities[localeTempl] = itemRarityType;
      
        }
      
      
        return LootController.LootRarities[localeTempl];
      }
      
      /**
       * Filters the Item Template by the Rarity system and returns whether to Accept or Decline
       * @param {*} itemTemplate 
       * @param {*} out_itemsRemoved 
       * @param {*} in_additionalLootModifier 
       * @returns {boolean} True = Include, False = Exclude
       */
      static FilterItemByRarity(
        itemTemplate, 
        out_itemsRemoved,
        in_additionalLootModifier
        ) {
          LootController.GetLootModifiers();

          const modifierSuperRare = LootController.LootModifiers.modifierSuperRare;
          const modifierRare = LootController.LootModifiers.modifierRare;
          const modifierUnCommon = LootController.LootModifiers.modifierUnCommon;
          const modifierCommon = LootController.LootModifiers.modifierCommon;
      
          if(in_additionalLootModifier === undefined)
            in_additionalLootModifier = 1.0;
            
          in_additionalLootModifier *= 2;
          in_additionalLootModifier *= LootController.LocationLootChanceModifierFromFile;
          const globals = DatabaseController.getDatabase().globals;
          in_additionalLootModifier *= globals.config.GlobalLootChanceModifier;
          
          if(out_itemsRemoved == undefined)
            out_itemsRemoved = {};
          if(out_itemsRemoved.numberOfRareRemoved === undefined) {
            out_itemsRemoved.numberOfRareRemoved = 0;
          }
          if(out_itemsRemoved.numberOfUncommonRemoved === undefined) {
            out_itemsRemoved.numberOfUncommonRemoved = 0;
          }
          if(out_itemsRemoved.numberOfCommonRemoved === undefined) {
            out_itemsRemoved.numberOfCommonRemoved = 0;
          }
      
          if(itemTemplate._props.QuestItem == true)
            return true;
      
          // If roubles (cash registers), always return true
          if(itemTemplate._id === "5449016a4bdc2d6f028b456f") 
            return true;
      
          const itemRarityType = LootController.GetItemRarityType(itemTemplate);
      
      
          // logger.logInfo(itemRarityType + " - " + itemTemplate._props.Name);
      
            if (itemRarityType == "SUPERRARE") {
              if (Math.random() > (modifierSuperRare * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfSuperrareRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "RARE") {
              if (Math.random() > (modifierRare * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfRareRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "UNCOMMON") {
              if (Math.random() > (modifierUnCommon * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfUncommonRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "COMMON")  {
              if (Math.random() > (modifierCommon * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfCommonRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else {
              return false;
            }
      }

      static async GenerateContainerLootAsync(in_data, in_locationLootChanceModifier, in_mapName)
      {
        await new Promise(function(myResolve, myReject) {
          myResolve(LootController.GenerateContainerLoot(in_data, in_locationLootChanceModifier, in_mapName));
        });
      }

      static GenerateContainerLoot(in_data, in_locationLootChanceModifier, in_mapName) {
        const containerData = in_data;
        const _items = in_data.Items;
        const newContainerId = utility.generateNewItemId();

        /** String Tpl Id
         * {string}
         */
        const ContainerId = _items[0]._tpl;
        LootController.PreviouslyGeneratedContainers.push(ContainerId);

        const isWeaponBox = (ContainerId === "5909d5ef86f77467974efbd8");
        
        const isAirdrop = containerData.Id.includes("Scripts") || containerData.Id.includes("scripts");

        const LootContainerIdTable = Object.keys(DatabaseController.getDatabase().locationConfigs.StaticLootTable);
        if (!LootContainerIdTable.includes(ContainerId)) {
            LootController.GenerateWeaponLoot(ContainerId, _items);
            return true;
            //return false;
        }
        const containerTemplate = global._database.items[ContainerId];
        let container2D = Array(containerTemplate._props.Grids[0]._props.cellsV)
        .fill()
        .map(() => Array(containerTemplate._props.Grids[0]._props.cellsH).fill(0));
        
        let LootListItems = LootController.GenerateLootList(ContainerId, in_mapName);
        if(isAirdrop) {
          LootListItems = LootController.GenerateAirdropLootList(ContainerId, in_mapName, container2D);
          // logger.logInfo(`Airdrop container contains ${LootListItems.length} items!`);
        }
        if(isWeaponBox) {
          // logger.logInfo(`This is a weapon box container`);
          LootListItems = LootController.GenerateWeaponBoxLootList(ContainerId, in_mapName, container2D);
        }
       
        let parentId = _items[0]._id;
        if(parentId == null) {
          // parentId = utility.generateNewId(undefined, 3);
          parentId = utility.generateNewIdQuick();
          _items[0]._id = parentId;
        }

        if(LootListItems.length == 0) {
          logger.logError(`EmptyContainer: ${ContainerId}`);
          return false;
        }
            const idPrefix = parentId.substring(0, parentId.length - 4);
            let idSuffix = parseInt(parentId.substring(parentId.length - 4), 16) + 1;
          
            const addedPresets = [];
          
            // roll a maximum number of items  to spawn in the container between 0 and max slot count
            // const minCount = Math.max(1, _RollMaxItemsToSpawn(ContainerTemplate));
            const minCount = 
            isWeaponBox ? LootListItems.length :
            Math.max(1, 
              Math.round(Math.random() * containerTemplate._props.Grids[0]._props.cellsV * containerTemplate._props.Grids[0]._props.cellsH));
  
            // const minCount = Math.max(1, 
            //   utility.getRandomInt(containerTemplate._props.Grids[0]._props.minCount, containerTemplate._props.Grids[0]._props.maxCount));
            
          
              let usedLootItems = [];
          
              // we finished generating spawn for this container now its time to roll items to put in container
              let itemWidth = 0;
              let itemHeight = 0;
              let indexRolled = [];
              mainIterator: for (let i = 0; i < minCount; i++) {
                //let item = {};
                let containerItem = {};
          
                let RollIndex = utility.getRandomInt(0, LootListItems.length - 1);
                // make sure its not already rolled index
                // while (indexRolled.includes(RollIndex)) {
                //   RollIndex = utility.getRandomInt(0, LootListItems.length - 1);
                // }
                // add current rolled index
                indexRolled.push(RollIndex);
                // getting rolled item
                const rolledRandomItemToPlace = DatabaseController.getDatabase().items[LootListItems[RollIndex]];
                
                if (rolledRandomItemToPlace === undefined) {
                  logger.logWarning(`Undefined in container: ${ContainerId}  ${LootListItems.length} ${RollIndex}`);
                  continue;
                }
                let result = { success: false };
                let maxAttempts = 1;
                // attempt to add item x times
                while (!result.success && maxAttempts > 0) {
                  //let currentTotal = 0;
                  // get basic width and height of the item
                  itemWidth = rolledRandomItemToPlace._props.Width;
                  itemHeight = rolledRandomItemToPlace._props.Height;
                  
                  result = helper_f.findSlotForItem(container2D, itemWidth, itemHeight);
                  maxAttempts--;
                }
                // finished attempting to insert item into container
          
                // if we weren't able to find an item to fit after x tries then container is probably full
                if (!result.success) 
                  break;
          
                // ----------------------------------------------------------------------------------------------------
                // Paulo: Remove all duplicate items in same container. You never get dups on Live. So done it here too
                if(usedLootItems.find(item => item._props.Name == rolledRandomItemToPlace._props.Name) === undefined) {
                  usedLootItems.push(rolledRandomItemToPlace);
                }
                else {
                  continue;
                }
          
                container2D = helper_f.fillContainerMapWithItem(container2D, result.x, result.y, itemWidth, itemHeight, result.rotation);
                let rot = result.rotation ? 1 : 0;

                const localeTempl = DatabaseController.getDatabase().locales.global.en.templates[rolledRandomItemToPlace._id];

                containerItem = {
                  _id: utility.generateNewIdQuick(),
                  // _id: idPrefix + idSuffix.toString(16),
                  // _id: utility.generateNewId(undefined, 3),
                  _tpl: rolledRandomItemToPlace._id,
                  parentId: parentId,
                  slotId: "main",
                  location: { x: result.x, y: result.y, r: rot },
                  itemNameForDebug: localeTempl.Name

                };
          
                let cartridges;
                if (rolledRandomItemToPlace._parent === "543be5dd4bdc2deb348b4569" || rolledRandomItemToPlace._parent === "5485a8684bdc2da71d8b4567") {
                  // Money or Ammo stack
                  let stackCount = utility.getRandomInt(rolledRandomItemToPlace._props.StackMinRandom, rolledRandomItemToPlace._props.StackMaxRandom);
                  containerItem.upd = { StackObjectsCount: stackCount };
                } else if (rolledRandomItemToPlace._parent === "543be5cb4bdc2deb348b4568") {
                  // Ammo container
                  idSuffix++;
          
                  cartridges = {
                    // _id: idPrefix + idSuffix.toString(16),
                    _id: utility.generateNewId(undefined, 3),
                    _tpl: rolledRandomItemToPlace._props.StackSlots[0]._props.filters[0].Filter[0],
                    parentId: containerItem._id,
                    slotId: "cartridges",
                    upd: { StackObjectsCount: rolledRandomItemToPlace._props.StackMaxRandom },
                  };
                } else if (rolledRandomItemToPlace._parent === "5448bc234bdc2d3c308b4569") {
                  // Magazine
                  idSuffix++;
                  cartridges = {
                    // _id: idPrefix + idSuffix.toString(16),
                    _id: utility.generateNewId(undefined, 3),
                    _tpl: rolledRandomItemToPlace._props.Cartridges[0]._props.filters[0].Filter[0],
                    parentId: parentId,
                    slotId: "cartridges",
                    upd: { StackObjectsCount: rolledRandomItemToPlace._props.Cartridges[0]._max_count },
                  };
                }
          
                _items.push(containerItem);
          
                if (cartridges) _items.push(cartridges);
                idSuffix++;
              }
            
            let changedIds = {};
            for (const item of _items) {

              const localeTempl = DatabaseController.getDatabase().locales.global.en.templates[item._tpl];
              item.itemNameForDebug = localeTempl.Name
              // const itemTemplateForNaming = DatabaseController.getDatabase().items[item._tpl];
              // item.itemNameForDebug = itemTemplateForNaming._props.ShortName;
              const newId = utility.generateNewIdQuick();
              // const newId = utility.generateNewItemId();
              changedIds[item._id] = newId;
              item._id = newId;


          
              if (!item.parentId) continue;
              item.parentId = changedIds[item.parentId];
            }
            return true

      }

      /**
       * 
       * @param {String} containerId 
       * @returns {Array} an array of loot item ids
       */
      static GenerateLootList(containerId, in_location) {
        let lootList = [];
        let UniqueLootList = [];
        // get static container loot pools
        let ItemList = DatabaseController.getDatabase().locationConfigs.StaticLootTable[containerId];
        let itemsRemoved = {};
        let numberOfItemsRemoved = 0;

        lootList = ItemList.SpawnList;
        lootList = lootList.filter(itemId => 
          !itemId.QuestItem
          && LootController.FilterItemByRarity(DatabaseController.getDatabase().items[itemId], itemsRemoved)
          );
      
        if(lootList.length === 0)
        {
            // If we have nothing, put a random item in there
            lootList.push(ItemList.SpawnList[utility.getRandomInt(0, ItemList.SpawnList.length-1)]);
        }
        // Unique/Distinct the List
        UniqueLootList = [...new Set(lootList)];
        
        // LootController.PreviouslyGeneratedItems = LootController.PreviouslyGeneratedItems.concat(UniqueLootList)

        return UniqueLootList;
      }

      static GenerateAirdropLootList(containerId, in_location, container2D) {
        let itemsRemoved = {};
        const LootList = [];
        let UniqueLootList = [];
        // get static container loot pools
        const ItemList = DatabaseController.getDatabase().locationConfigs.StaticLootTable[containerId];
        // get dynamic container loot pools for map
        const DynamicLootForMap = DatabaseController.getDatabase().locationConfigs.DynamicLootTable[in_location];
        if(DynamicLootForMap !== undefined) {
          const DynamicLootForMapKeys = Object.keys(DatabaseController.getDatabase().locationConfigs.DynamicLootTable[in_location]);
          if(DynamicLootForMapKeys !== undefined) {
            for(var i = 0; i < container2D.length-1 && LootList.length < container2D.length-1; i++) {
              const selectedLootIndex = utility.getRandomInt(0, DynamicLootForMapKeys.length);
              const selectedLootKey = DynamicLootForMapKeys[selectedLootIndex];
              if(selectedLootKey === undefined) 
                continue;

              const selectedLoot = DynamicLootForMap[selectedLootKey].SpawnList;
              if(selectedLoot === undefined) 
                continue;

              for (const item of selectedLoot) {
                const itemTemplate = DatabaseController.getDatabase().items[item];
                if (itemTemplate._props.LootExperience === undefined) {
                  logger.logWarning(`itemTemplate._props.LootExperience == "undefined" for ${itemTemplate._id}`);
                  continue;
                }
                if(!LootController.FilterItemByRarity(itemTemplate, itemsRemoved, 5))
                  LootList.push(item);
              }
            }
          }
        }

        // Unique/Distinct the List
        UniqueLootList = [...new Set(LootList)];
        
        return UniqueLootList;
      }

      static GenerateAirdropLootListForAkiAirdrop() {
        
        const dbItems = ItemController.getDatabaseItems();
        const dbItemsList = ItemController.getDatabaseItemsList();
        // airdrop crate
        const containerId = "61a89e5445a2672acf66c877";
        const containerTemplate = dbItems[containerId];
        let container2D = Array(containerTemplate._props.Grids[0]._props.cellsV)
        .fill()
        .map(() => Array(containerTemplate._props.Grids[0]._props.cellsH).fill(0));

        const itemList = [];


        const armors = ItemController.getAllArmors();
        const rigs = ItemController.getAllRigs();
        const backpacks = ItemController.getAllBackpacks();

        let attempts = 100;
        while(attempts-- > 0) {
          let randomItem = LootController.GetRandomHideoutRequiredItem();
          if(Math.random() > 0.95) {
            // pick random armor
            randomItem = armors[utility.getRandomInt(0, armors.length-1)];
          }
          else if(Math.random() > 0.95) {
            // pick random rig
            randomItem = rigs[utility.getRandomInt(0, rigs.length-1)];
          }
          else if(Math.random() > 0.95) {
            // pick random backpack
            randomItem = backpacks[utility.getRandomInt(0, backpacks.length-1)];
          }
          else if(Math.random() > 0.95) {
            // pick random weapon preset

          }

          if(LootController.FilterItemByRarity(randomItem, undefined, 5)) {
            let itemWidth = randomItem._props.Width;
            let itemHeight = randomItem._props.Height;
            const result = helper_f.findSlotForItem(container2D, itemWidth, itemHeight);
            if(result.success) {
              randomItem = JSON.parse(JSON.stringify(randomItem));
              randomItem.slotResult = result;
              randomItem.slotResult.itemWidth = itemWidth;
              randomItem.slotResult.itemHeight = itemHeight;
              container2D = helper_f.fillContainerMapWithItem(container2D, result.x, result.y, itemWidth, itemHeight, result.rotation);
              itemList.push(randomItem);
            }
          }
        }

        // const presetList = itemList2.filter(x => ItemController.hasPreset(x));
        const resultList = [];
        for(const item of itemList) {
          const expectedResultObj = {
            tpl: item._id,
            isPreset: false,
            stackCount: 1,
            id: utility.generateNewId(),
          }
          resultList.push(expectedResultObj);
        }

        return resultList;
      }

      static GenerateWeaponBoxLootList(containerId, in_location, container2D) {

        const lootList = [];
        // get static container loot pools
        const itemList = DatabaseController.getDatabase().locationConfigs.StaticLootTable[containerId].SpawnList
        const presetList = itemList.filter(x => ItemController.hasPreset(x));
        const selectedPresetId = presetList[utility.getRandomInt(0, presetList.length-1)];
        if(selectedPresetId) {
          const selectedPreset = ItemController.getStandardPreset(selectedPresetId);
          if(selectedPreset) {
            for(const presetItem of selectedPreset._items) {
              lootList.push(presetItem._tpl);
            }
          }
        }
       
        return [...new Set(lootList)];;
      }

      static GenerateWeaponLoot(ContainerId, _items) {
        // Check if static weapon.
        
        if (ContainerId != "5cdeb229d7f00c000e7ce174" && ContainerId != "5d52cc5ba4b9367408500062") {
          logger.logWarning("GetLootContainerData is null something goes wrong please check if container template: " + _items[0]._tpl + " exists");
          return;
        } else {
          _items[0].upd = { FireMode: { FireMode: "fullauto" } };
          // stationary gun is actually a container...
          const GunTempalte = global._database.items[_items[0]._tpl]; // template object
          const MagazineTemplate = global._database.items[GunTempalte._props.Slots[0]._props.filters[0].Filter[0]]; // template object
          const Magazine_Size = MagazineTemplate._props.Cartridges[0]._max_count; // number
          const AmmoTemplates = MagazineTemplate._props.Cartridges[0]._props.filters[0].Filter; // array
          const magazine = {
            _id: utility.generateNewId("M"),
            _tpl: MagazineTemplate._id,
            parentId: _items[0]._id,
            slotId: "mod_magazine",
          };
          _items.push(magazine);
          for (let i = 0; i < Magazine_Size / 4; i++) {
            if (_items[0]._tpl == "5d52cc5ba4b9367408500062") {
              // this is grenade launcher ammo preset creation
              if (i == 0) {
                const bullet = {
                  _id: utility.generateNewId("B"),
                  _tpl: AmmoTemplates[0],
                  parentId: magazine._id,
                  slotId: "cartridges",
                };
                _items.push(bullet);
                continue;
              }
              const bullet = {
                _id: utility.generateNewId("B"),
                _tpl: AmmoTemplates[0],
                parentId: magazine._id,
                slotId: "cartridges",
                location: i,
              };
              _items.push(bullet);
            } else {
              // this is machine gun ammo preset creation
              const ammoCount = i % 2 == 0 ? 3 : 1;
              const bullet = {
                _id: utility.generateNewId("B"),
                _tpl: AmmoTemplates[i % 2],
                parentId: magazine._id,
                slotId: "cartridges",
                location: i,
                upd: {
                  StackObjectsCount: ammoCount,
                },
              };
              _items.push(bullet);
            }
          }
          return;
        }
      }

      /**
       * Generates all "forced" (usually quest) items into containers
       * @param {*} forced 
       * @param {*} outputLoot 
       */
      static GenerateForcedLootInContainers(forced, outputLoot) {
        let count = 0;
        // ------------------------------------------------------
        // Handle any Forced Static Loot - i.e. Unknown Key
        // 
        logger.logInfo(`Forced Loot Count: ${forced.length}`);
        let numberOfForcedStaticLootAdded = 0;
        for(let iForced in forced) {
          let thisForcedItem = utility.DeepCopy(forced[iForced]);
          let lootItem = forced[iForced];
          // console.log(lootItem);
          lootItem.IsForced = true;
          if(lootItem.IsStatic) {
            count++;
            const lootTableIndex = outputLoot.findIndex(x=>x.Id === thisForcedItem.Id);
            const lootTableAlreadyExists = lootTableIndex !== -1;
            let newParentId = "";
            if(!lootTableAlreadyExists) {
              newParentId = utility.generateNewItemId();
              lootItem.Root = newId;
            }
            else {
              lootItem = outputLoot[lootTableIndex];
              newParentId = lootItem.Root;
            }
            let newForcedItemsList = [];

            for(let iDataItem in thisForcedItem.Items) {
              let newForcedInnerItem = {};
              if(iDataItem == 0 && !lootTableAlreadyExists)
              {
                newForcedInnerItem._tpl = thisForcedItem.Items[iDataItem];
                newForcedInnerItem._id = newId;
                lootItem.Items.push(newForcedInnerItem);
                continue;
              }
              let newInnerItemId = utility.generateNewItemId();
              newForcedInnerItem._id = newInnerItemId;
              newForcedInnerItem._tpl = thisForcedItem.Items[iDataItem];
              const itemTemplateForNaming = global._database.items[newForcedInnerItem._tpl];
              newForcedInnerItem.itemNameForDebug = itemTemplateForNaming._props.ShortName;
              newForcedInnerItem.parentId = newParentId;
              newForcedInnerItem.slotId = "main";
              newForcedInnerItem.location = {
                    x: lootTableAlreadyExists ? iDataItem : (iDataItem-1),
                    y: 0,
                    r: 0
                  }
              lootItem.Items[iDataItem > 0 ? iDataItem : (parseInt(iDataItem) + 1)] = newForcedInnerItem;
            }
            if(lootTableAlreadyExists)
              outputLoot[lootTableIndex] = lootItem;
            else
              outputLoot.push(lootItem);

            numberOfForcedStaticLootAdded++;
          }
        }
        if(numberOfForcedStaticLootAdded > 0) {
          logger.logSuccess(`Added ${numberOfForcedStaticLootAdded} Forced Static Loot`);
        }
        return count;
      }

      /**
       * Generates all "forced" (usually quest) items into the world
       * @param {*} forced 
       * @param {*} output 
       * @returns {number} count of items placed, excluding statics
       */
      static GenerateForcedLootLoose(forced, output) {
          let count = 0;
          for (const i in forced) {
            const data = utility.DeepCopy(forced[i]);
            if(data.IsStatic)
              continue;
              const newItemsData = [];
            // forced loot should be only contain 1 item... (there shouldnt be any weapon in there...)
            const newId = utility.generateNewId(undefined, 3);
      
            const createEndLootData = {
              Id: data.Id,
              IsStatic: data.IsStatic,
              useGravity: data.useGravity,
              randomRotation: data.randomRotation,
              Position: data.Position,
              Rotation: data.Rotation,
              IsGroupPosition: data.IsGroupPosition,
              GroupPositions: data.GroupPositions,
              Root: newId,
              Items: [
                {
                  _id: newId,
                  _tpl: data.Items[0],
                },
              ],
            };
      
            output.Loot.push(createEndLootData);
            count++;
          }
          return count;
      }

      static GetRandomHideoutRequiredItem() {
        let randomItem = undefined;
        const dbItems = ItemController.getDatabaseItems();
        const dbItemKeys = Object.keys(dbItems);
        while(randomItem === undefined)
        {
          const dbHideoutAreas = DatabaseController.getDatabase().hideout.areas;
          const randomArea = dbHideoutAreas[utility.getRandomInt(0, dbHideoutAreas.length - 1)];
          const randomAreaStageKeys = Object.keys(randomArea.stages);
          const randomAreaStageKey = randomAreaStageKeys[utility.getRandomInt(0, randomAreaStageKeys.length - 1)];
          const randomAreaStage = randomArea.stages[randomAreaStageKey];
          if(randomAreaStage.requirements.length > 0) {
            const randomAreaStageTemplateItems = randomAreaStage.requirements
            .filter(x => x.templateId !== undefined && !ItemController.isMoney(x.templateId));
            const randomAreaStageTemplate = randomAreaStageTemplateItems[utility.getRandomInt(0, randomAreaStageTemplateItems.length - 1)];
            if(randomAreaStageTemplate)
              randomItem = dbItems[randomAreaStageTemplate.templateId];
          }
        } 
        return randomItem;
      }

      static async GenerateDynamicLootLooseAsync(typeArray, output, locationLootChanceModifier, MapName)
      {
        await new Promise(function(myResolve, myReject) {
          myResolve(GenerateDynamicLootLoose(typeArray, output, locationLootChanceModifier, MapName));
        });
      }

      /**
       * Generates the "Dynamic" loot found loose on the floor or shelves
       * @param {Array} typeArray 
       * @param {Array} output 
       * @param {number} locationLootChanceModifier 
       * @param {string} MapName 
       * @returns {number} count of generated items
       */
      static GenerateDynamicLootLoose(typeArray, output, locationLootChanceModifier, in_mapName)
      {
        let count = 0;
        const currentUsedPositions = [];
        const currentUsedItems = [];
        let filterByRarityOutput = {};

        const looseLootMultiplier = ConfigController.Configs["gameplay"].locationloot.DynamicLooseLootMultiplier;
        let dbLocationDynamicLoot = DatabaseController.getDatabase().locations[in_mapName].loot.dynamic;
        let dbLocationConfigs = DatabaseController.getDatabase().locationConfigs;
        let dbLocationConfigLoot = DatabaseController.getDatabase().locationConfigs.DynamicLootTable[in_mapName];

        // const dynamicLootTable = JSON.parse(fs.readFileSync(process.cwd() + `/db/locations/DynamicLootTable.json`));
        const mapDynamicLootTable = dbLocationConfigLoot;// dynamicLootTable[in_mapName];
        // for (let itemLoot in typeArray) {
          // const lootData = typeArray[itemLoot];
        mapLoot: for(const lootData of typeArray) {

          const randomItems = [];

          let spawnList = lootData.Items;
          if(spawnList.length === 0 || utility.getPercentRandomBool(10)) {
            const lootTable = mapDynamicLootTable[Object.keys(mapDynamicLootTable).find(x => lootData.Id.toLowerCase().includes(x))];
            if(lootTable) {
              spawnList = lootTable.SpawnList;
            }
          }
          spawnList = spawnList.filter(x => 
            this.FilterItemByRarity(DatabaseController.getDatabase().items[x], filterByRarityOutput, looseLootMultiplier)
          );

          // if empty spawn list and randomly not generate hideout item below
          if(spawnList.length === 0 && utility.getPercentRandomBool(40))
            continue;

          for (const id of spawnList) {
            const item = DatabaseController.getDatabase().items[id];
            randomItems.push(item);
          }
    
          const generatedItemId = utility.generateNewItemId();
          let randomItem = randomItems[utility.getRandomInt(0, randomItems.length - 1)];
          if(randomItem === undefined) {
            randomItem = LootController.GetRandomHideoutRequiredItem();
          }

          const localeTempl = DatabaseController.getDatabase().locales.global.en.templates[randomItem._id];

          const createdItem = {
            _id: generatedItemId,
            _tpl: randomItem._id,
            DebugName: localeTempl
          };
    
          // item creation
          let createEndLootData = {
            Id: lootData.Id,
            IsStatic: lootData.IsStatic,
            useGravity: lootData.useGravity,
            randomRotation: lootData.randomRotation,
            Position: lootData.Position,
            Rotation: lootData.Rotation,
            IsGroupPosition: lootData.IsGroupPosition,
            GroupPositions: lootData.GroupPositions,
            Root: generatedItemId,
            Items: [createdItem],
          };

          if(ItemController.isAmmoBox(randomItem._id))
          {
            // this is not working, ignoring for now
            continue;
          }
          if(ItemController.isMoney(randomItem._id))
          {
            // this is not working, ignoring for now
            continue;
          }
          if(ItemController.isAmmo(randomItem._id))
          {
            // this is not working, ignoring for now
            continue;
          }
    
          let similarUsedPosition = currentUsedPositions.find(p => 
            mathjs.round(p.x, 3) == mathjs.round(lootData.Position.x, 3)
            && mathjs.round(p.y, 3) == mathjs.round(lootData.Position.y, 3)
            && mathjs.round(p.z, 3) == mathjs.round(lootData.Position.z, 3)
          );
          if(similarUsedPosition !== undefined
            ) {
    
            continue;
          }
    
            count++;
            output.Loot.push(createEndLootData);
            currentUsedPositions.push(createEndLootData.Position);
            currentUsedItems.push(createEndLootData);
       
        }
        
        return count;
      }


      /**
       * Generates the "Static" loot. Usually containers, airdrops, or weapons
       * @param {*} typeArray 
       * @param {*} output 
       * @param {*} locationLootChanceModifier 
       * @param {*} MapName 
       * @returns {Number} number of items generated
       */
      static GenerateStaticLoot(typeArray, output, locationLootChanceModifier, MapName) {
        let count = 0;
        let dateStarted = Date.now();
        for (let i in typeArray) {
          let data = typeArray[i];
          dateStarted = Date.now();
    
          // Do not regenerate the same container twice
          if(LootController.PreviouslyGeneratedContainers.findIndex(x=>x.Id === data.Items[0]._tpl) !== -1)
            continue;
    
          if(LootController.GenerateContainerLoot(data, locationLootChanceModifier, MapName))
            count++;
    
    
    
    
    
    
          if (Date.now() - dateStarted > 50) logger.logInfo(`Slow Container ${data.Id} [${Date.now() - dateStarted}ms]`);
          dateStarted = Date.now();
          data.Root = data.Items[0]._id;
          output.Loot.push(data);
          // count++;
        }
        return count;
      }
}

module.exports.LootController = LootController;
