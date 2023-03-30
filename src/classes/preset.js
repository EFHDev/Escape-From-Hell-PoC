"use strict";

class ItemPresets {
    initialize() {
        const presets = Object.values(global._database.globals.ItemPresets);
        const reverse = {};

        for (const p of presets) {
            let tpl = p._items[0]._tpl;

            if (!(tpl in reverse)) {
                reverse[tpl] = [];
            }

            reverse[tpl].push(p._id);
        }

        this.lookup = reverse;
    }

    isPreset(id) {
        return id in global._database.globals.ItemPresets;
    }

    hasPreset(templateId) {
        if(this.lookup === undefined)
            this.initialize();
            
        return templateId in this.lookup;
    }

    getPresets(templateId) {
        if (!this.hasPreset(templateId)) {
            return [];
        }

        const presets = [];
        const ids = this.lookup[templateId];

        for (const id of ids) {
            presets.push(global._database.globals.ItemPresets[id]);
        }

        return presets;
    }

    //returns items array corresponding to the preset.
    getBuiltWeaponPreset(presetID) {
        if (!this.isPreset(presetID)) {
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
    getRandomPresetIdFromWeaponId(WepId) {
        if (!this.hasPreset(WepId)) {
            return "";
        }
        let wepPresets = [];
        wepPresets = this.getPresets(WepId);

        if (wepPresets.length > 0) {
            //logger.logSuccess("Found following presets: "+JSON.stringify(wepPresets, null, 2));
            return wepPresets[utility.getRandomInt(0, wepPresets.length - 1)]._id;
        } else {
            logger.logError(`No presets found for ${WepId}.`); //should never enter here but, just in case.
            return "";
        }
    }

    getStandardPreset(templateId) {
        if (!this.hasPreset(templateId)) {
            return false;
        }

        const allPresets = this.getPresets(templateId);

        for (const p of allPresets) {
            if ("_encyclopedia" in p) {
                return p;
            }
        }

        return allPresets[0];
    }

    getBaseItemTpl(presetId) {
        if (this.isPreset(presetId)) {
            let preset = global._database.globals.ItemPresets[presetId];

            for (let item of preset._items) {
                if (preset._parent === item._id) {
                    return item._tpl;
                }
            }
        }

        return "";
    }

    findPresetByParent(parentId) {
        let presetIndex = global._database.globals.ItemPresets.findIndex(p => p._parent === parentId);
        if (presetIndex) { 
            return global._database.globals.ItemPresets[p]._id; 
        }
    }
}

module.exports.handler = new ItemPresets();