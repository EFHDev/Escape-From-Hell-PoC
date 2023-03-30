const { DatabaseController } = require('./DatabaseController');
const utility = require('../../core/util/utility');

/**
 * 
 */
class ItemController
{
    static tplLookup = {};
    static presetLookup = {};
    static instance = new ItemController();

    constructor() {

        const presets = Object.values(global._database.globals.ItemPresets);
        const reverse = {};

        for (const p of presets) {
            let tpl = p._items[0]._tpl;

            if (!(tpl in reverse)) {
                reverse[tpl] = [];
            }

            reverse[tpl].push(p._id);
        }

        ItemController.presetLookup = reverse;
    }

    static getDatabaseItems() {
        const dbItems = DatabaseController.getDatabase().items;
        
        return dbItems;
    }

    static getDatabaseItemsList() {
        const dbItems = DatabaseController.getDatabase().items;
        const dbItemsKeys = Object.keys(dbItems);
        const itemList = [];
        for(const id of dbItemsKeys) {
            itemList.push(dbItems[id]);
        }
        return itemList;
    }
   
    /**
    * Finds an item given its id using linear search
    * @param {*} items 
    * @param {*} id 
    * @returns {object} item
    */
    static findItemById(items, id) {
        for (const item of items) {
            if (item._id === id) {
                return item;
            }
        }

        return undefined;
    }
  
    /* Get item data from items.json
    * input: Item Template ID
    * output: item | { error: true, errorMessage: string }
    */
    static tryGetItem(template) {
        const item = global._database.items[template];
    
        if (item === undefined) return { error: true, errorMessage: `Unable to find item '${template}' in database` }
    
        return item;
    }

    /**
     * Determines whether the item is an Ammo Box by TemplateId
     * @param {*} tpl 
     * @returns {boolean} true/false
     */
    static isAmmoBox(tpl) {
         return ItemController.getDatabaseItems()[tpl]._parent === "543be5cb4bdc2deb348b4568"
    }

    /**
     * Determines whether the item is an Ammo Box by TemplateId
     * @param {*} tpl 
     * @returns {boolean} true/false
     */
     static isAmmo(tpl) {
        return ItemController.getDatabaseItems()[tpl]._parent === "5485a8684bdc2da71d8b4567"
   }

    static isRig(tpl) {
        return ItemController.getDatabaseItems()[tpl]._parent === "5448e5284bdc2dcb718b4567"
    }

    static isVest(tpl) {
        return isRig(tpl);
    }

    static getAllRigs() {
        return ItemController.getDatabaseItemsList().filter(x => ItemController.isRig(x._id));
    }

    static isArmor(tpl) {
        return ItemController.getDatabaseItems()[tpl]._parent === "5448e54d4bdc2dcc718b4568"
    }

    static getAllArmors() {
        return ItemController.getDatabaseItemsList().filter(x => ItemController.isArmor(x._id));
    }

    static isBackpack(tpl) {
        return ItemController.getDatabaseItems()[tpl]._parent === "5448e53e4bdc2d60728b4567"
    }

    static getAllBackpacks() {
        return ItemController.getDatabaseItemsList().filter(x => ItemController.isBackpack(x._id));
    }

    /**
     * Create an Ammo Box via a TemplateId
     * @param {*} tpl 
     * @returns {Array} new attached to the box items
     */
    static createAmmoBox(tpl) {
        if(!ItemController.isAmmoBox(tpl))
            throw "This isn't an Ammo Box, dumbass!";

        const items = [];
        var box = ItemController.tryGetItem(tpl);
        // const ammoTemplate = global._database.items[createEndLootData.Items[0]._tpl]._props.StackSlots[0]._props.filters[0].Filter[0];
        const ammoTemplate = box._props.StackSlots[0]._props.filters[0].Filter[0];
        const ammoMaxStack = global._database.items[ammoTemplate]._props.StackMaxSize;
        const randomizedBulletsCount = utility.getRandomInt(
            box._props.StackMinRandom,
            box._props.StackMaxRandom
        );
        const generatedItemId = utility.generateNewItemId();
        items.push({
            _id: generatedItemId,
            _tpl: box._tpl,
            slotId: "hideout",
            upd: {
                StackObjectsCount: 1,
            },
            debugName: box._props.Name
        });
        let locationCount = 0;
        for (let i = 0; i < randomizedBulletsCount; i += ammoMaxStack) {
            const currentStack = i + ammoMaxStack > randomizedBulletsCount ? randomizedBulletsCount - i : ammoMaxStack;
            items.push({
                _id: utility.generateNewItemId(),
                _tpl: ammoTemplate,
                parentId: generatedItemId,
                slotId: "cartridges",
                location: locationCount,
                upd: {
                    StackObjectsCount: currentStack,
                },
            });
            locationCount++;
        }
        return items;
    }

    /**
     * Determines whether the item is a preset by TemplateId
     * @param {*} tpl 
     * @returns {boolean} true/false
     */
     static isItemPreset(tpl) {
        return DatabaseController.getDatabase().globals.ItemPresets[tpl] !== undefined;
     }


    /* A reverse lookup for templates */
    static getTemplateLookup() {

        if (ItemController.tplLookup.lookup === undefined) {
            const lookup = {
                items: {
                byId: {},
                byParent: {},
                },
                categories: {
                byId: {},
                byParent: {},
                },
            };
        
            for (let x of global._database.templates.Items) {
                lookup.items.byId[x.Id] = x.Price;
                lookup.items.byParent[x.ParentId] || (lookup.items.byParent[x.ParentId] = []);
                lookup.items.byParent[x.ParentId].push(x.Id);
            }
        
            for (let x of global._database.templates.Categories) {
                lookup.categories.byId[x.Id] = x.ParentId ? x.ParentId : null;
                if (x.ParentId) {
                // root as no parent
                lookup.categories.byParent[x.ParentId] || (lookup.categories.byParent[x.ParentId] = []);
                lookup.categories.byParent[x.ParentId].push(x.Id);
                }
            }
        
            ItemController.tplLookup.lookup = lookup;
        }
    
        return ItemController.tplLookup.lookup;
    }
  
  /** Get template price
   * Explore using itemPriceTable to get price instead of using tplLookup()
   * 
   * @param {string} x  Item ID to get price for
   * @returns  Price of the item
   */
  static getTemplatePrice(x) {
    return x in ItemController.getTemplateLookup().items.byId ? ItemController.getTemplateLookup().items.byId[x] : 1;
  }

  static isMoney(tpl) {
    const moneyTplArray = ["569668774bdc2da2298b4568", "5696686a4bdc2da3298b456a", "5449016a4bdc2d6f028b456f"];
    return moneyTplArray.findIndex((moneyTlp) => moneyTlp === tpl) !== -1;
  }

  static enumerateItemChildren(item, item_list) {
    return item_list.filter((child_item) => child_item.parentId === item._id);
  }
  
  /**
   * Recursively iterates through children of `item` present in `item_list`
   * @param {*} item 
   * @param {*} item_list 
   * @returns {Array} Array of child items found
   */
  static enumerateItemChildrenRecursively(item, item_list) {
  
    let stack = ItemController.enumerateItemChildren(item, item_list);
    let child_items = [...stack];
  
    while (stack.length > 0) {
      let child = stack.pop();
      let children_of_child = ItemController.enumerateItemChildren(child, item_list);
      stack.push(...children_of_child);
      child_items.push(...children_of_child);
    }
  
    return child_items;
  }

  static hasPreset(templateId) {
        
    return templateId in ItemController.presetLookup;
  }

  static isPreset(id) {
    return id in global._database.globals.ItemPresets;
}

static getPresets(templateId) {
    if (!this.hasPreset(templateId)) {
        return [];
    }

    const presets = [];
    const ids = ItemController.presetLookup[templateId];

    for (const id of ids) {
        presets.push(global._database.globals.ItemPresets[id]);
    }

    return presets;
}

//returns items array corresponding to the preset.
static getBuiltWeaponPreset(presetID) {
    if (!ItemController.isPreset(presetID)) {
        logger.logError("not a preset: " + presetID);
        return [];
    }
    let foundP = utility.DeepCopy(global._database.globals.ItemPresets[presetID]);
    logger.logError(`Found preset for ID ${presetID}: \n` + JSON.stringify(foundP, null, 2));

    for (let item of foundP._items) {
        let ogID = item._id;
        //repair ID
        item._id = utility.generateNewItemId();

        // check for children whose parentId was the item's original ID
        // and replace it with the new id
        for (let iitem of foundP._items) {
            if (iitem.parentId == ogID) {
                iitem.parentId = item._id;
            }
        }
    }
    return foundP._items;
}

//gets a random preset from a given receiver id
static getRandomPresetIdFromWeaponId(WepId) {
    if (!ItemController.hasPreset(WepId)) {
        return "";
    }
    let wepPresets = [];
    wepPresets = ItemController.getPresets(WepId);

    if (wepPresets.length > 0) {
        //logger.logSuccess("Found following presets: "+JSON.stringify(wepPresets, null, 2));
        return wepPresets[utility.getRandomInt(0, wepPresets.length - 1)]._id;
    } else {
        logger.logError(`No presets found for ${WepId}.`); //should never enter here but, just in case.
        return "";
    }
}

static getStandardPreset(templateId) {

    let preset = { _items: [] };

    if (!ItemController.hasPreset(templateId)) {
        return false;
    }

    const allPresets = ItemController.getPresets(templateId);

    for (const p of allPresets) {
        if ("_encyclopedia" in p) {
            return p;
        }
    }
    preset = allPresets[0];
    return preset;
}

static getBaseItemTpl(presetId) {
    if (ItemController.isPreset(presetId)) {
        const preset = global._database.globals.ItemPresets[presetId];

        for (const item of preset._items) {
            if (preset._parent === item._id) {
                return item._tpl;
            }
        }
    }

    return "";
}

static findPresetByParent(parentId) {
    let presetIndex = global._database.globals.ItemPresets.findIndex(p => p._parent === parentId);
    if (presetIndex) { 
        return global._database.globals.ItemPresets[p]._id; 
    }
}

  
}

module.exports.ItemController = ItemController;