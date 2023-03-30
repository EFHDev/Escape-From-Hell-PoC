const { AccountController } = require("../src/Controllers/AccountController");
const utility = require('../core/util/utility');
const console = require('../core/console');

class saveProfileTests {

    static instance = new saveProfileTests();
    saveProfileTest() {
        // grab and duplicate and account and profile for test
        // const testAccount = AccountController.getAllAccounts()[0];
        const testProfile = utility.DeepCopy(AccountController.getPmcProfile("AIDd8c3266e61172b3a17dc4dce"));

        // remove stash items from the profile to replicate the profile coming out of the raid
        const hideoutItems = testProfile.Inventory.items.filter(x=>x.slotId === "hideout");
        // check for child items first and remove
        const childItemsToRemove = [];
        for(const item of hideoutItems) {
            if(hideoutItems.findIndex(y=>y._id === item.parentId) !== -1)
                childItemsToRemove.push(item);
        }
        let nonHideoutItems = testProfile.Inventory.items.filter(x=>x.slotId !== "hideout");
        nonHideoutItems = nonHideoutItems.filter(x => testProfile.Inventory.items.findIndex(y => y._id === x.parentId) !== -1);
        testProfile.Inventory.items = nonHideoutItems;
        offraid_f.saveProgress(
            {
                exit: "survived",
                profile: testProfile,
                isPlayerScav: false,
                health: {
                "IsAlive": true,
                "Health": {
                    "Head": {
                    "Maximum": 35,
                    "Current": 35,
                    "Effects": {}
                    },
                    "Chest": {
                    "Maximum": 85,
                    "Current": 85,
                    "Effects": {}
                    },
                    "Stomach": {
                    "Maximum": 70,
                    "Current": 70,
                    "Effects": {}
                    },
                    "LeftArm": {
                    "Maximum": 60,
                    "Current": 60,
                    "Effects": {}
                    },
                    "RightArm": {
                    "Maximum": 60,
                    "Current": 60,
                    "Effects": {}
                    },
                    "LeftLeg": {
                    "Maximum": 65,
                    "Current": 65,
                    "Effects": {}
                    },
                    "RightLeg": {
                    "Maximum": 65,
                    "Current": 65,
                    "Effects": {}
                    }
                },
                "Hydration": 100,
                "Energy": 100
                }
            }
            , "AIDd8c3266e61172b3a17dc4dce");
    }
}

console.consoleResponse.addCommand("saveProfile", "", saveProfileTests.instance.saveProfileTest);

module.exports.saveProfileTests = new saveProfileTests();
global["saveProfileTests"] = saveProfileTests.instance;
