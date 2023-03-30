const { DatabaseController } = require('./DatabaseController');
const fs = require('fs');
const utility = require('./../../core/util/utility');

/**
 * Clothing and Character Customization
 */
class CustomizationController {

     /**
     * 
     * @param {*} sessionID 
     * @returns {object}
     */
      static getCustomization(traderId, sessionID) {
        var customizationSuits = JSON.parse(fs.readFileSync(`db/traders/5ac3b934156ae10c4430e83c/suits.json`));

        const allCustomization = DatabaseController.getDatabase().customization;
        var custKeys = Object.keys(allCustomization);
        for(let id in allCustomization) {
            const item = allCustomization[id];
            if(item._parent !== "" && customizationSuits.findIndex(x=> x.suiteId === id || x._id === id ) === -1) {
                //console.log(item);
                let newItem = 
                    {
                        "_id": utility.generateNewId(undefined, 4),
                        "tid": "5ac3b934156ae10c4430e83c",
                        "suiteId": id,
                        "isActive": true,
                        "requirements": {
                          "loyaltyLevel": 0,
                          "profileLevel": 0,
                          "standing": 0,
                          "skillRequirements": [],
                          "questRequirements": [],
                          "itemRequirements": []
                        }
                    }
                    customizationSuits.push(newItem);
            }
        }
        // const result = {"_id":sessionID,"suites": custKeys};
        // return result;


        /* Customization items format 

        "5e9975c486f774382b6320cb": {
      "_id": "5e9975c486f774382b6320cb",
      "_name": "Top_BOSS_Sanitar",
      "_parent": "5cc0868e14c02e000c6bea68",
      "_type": "Item",
      "_proto": "5cdea33e7d6c8b0474535dac"
    },
    */


        /* Trader selling format
{
      "_id": "5d1f555086f7744bcd134594",
      "tid": "5ac3b934156ae10c4430e83c",
      "suiteId": "5cd946231388ce000d572fe3",
      "isActive": true,
      "requirements": {
        "loyaltyLevel": 0,
        "profileLevel": 0,
        "standing": 0,
        "skillRequirements": [],
        "questRequirements": [],
        "itemRequirements": []
      }
    }
        */



        return customizationSuits;
    }
    /**
     * 
     * @param {*} sessionID 
     * @returns {object}
     */
    static getCustomizationStorage(sessionID) {
        return fs.readFileSync(`user/profiles/${sessionID}/storage.json`);
        // const allCustomization = DatabaseController.getDatabase().customization;
        // var custKeys = Object.keys(allCustomization);
        // const result = {"_id":sessionID,"suites": custKeys};
        // return result;
    }
}

module.exports.CustomizationController = CustomizationController;