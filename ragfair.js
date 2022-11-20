// Written by plt_armr(king) of MTGA/AE, Mans a myth and legend, hosting this here to learn off it, because brain square and i will forget where i saved the file

function fleaLock(sessionID) {
    let pmcData = profile_f.handler.getPmcProfile(sessionID); //set player profile
    let fleaKeyId = "fleakey";
    let devfleakeyId = "devfleakey";
    let timenow = Math.floor(Date.now() / 1000); //get the time //read the file
    let fleaOpen = false;
    let killtime = global._database.gameplayConfig.trading.fleaKeyLife; //get the key life from config

    //create the timerfile if it doesn't exist
    if (!fileIO.exist(`./user/configs/killtime.json`)){
        fileIO.write(`./user/configs/killtime.json`, true, true, false);
    }

    //check the if the timer is active
    let usedTime = fileIO.readParsed(`./user/configs/killtime.json`);
    if (usedTime + killtime > timenow) { 
        fleaOpen = true;
        return fleaOpen;
    }

  
  //Ragfair.js
    //check for the flea key in player inventory
    for (let item of pmcData.Inventory.items) { 
        if (item._tpl === fleaKeyId || item._tpl === devfleakeyId) { 
            fleaOpen = true;
            if (item._tpl === devfleakeyId) { // don't delete the dev key
                return fleaOpen;
            } else { 
                let output = item_f.handler.getOutput();
                insurance_f.handler.remove(pmcData, item._id, sessionID); // remove insurance
                move_f.removeItem(pmcData, item._id, output, sessionID); // delete the key 
            }
            logger.logInfo(`TARKOROLA Flea Market: Access Granted`);
            fileIO.write(`./user/configs/killtime.json`, timenow, true, false); //set the timer
        }
    }
    return fleaOpen;
}

function hasDevKey(sessionID) {
    let devfleakeyId = "devfleakey";
    let pmcData = profile_f.handler.getPmcProfile(sessionID); //set player profile
    let isDev = false;

    for (let item of pmcData.Inventory.items) {
        if (item._tpl === devfleakeyId) {
            isDev = true;
        }
    }
    return isDev
}


