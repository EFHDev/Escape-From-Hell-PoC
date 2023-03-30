"use strict";
const { AccountController } = require('./../Controllers/AccountController')
const fs = require('fs');

/*
 * ProfileServer class maintains list of active profiles for each sessionID in memory. All first-time loads and save
 * operations also write to disk.*
 */
class ProfileServer {
  constructor() {
    // AccountController.profiles = {};
    // this.profileFileAge = {};
    // this.skippedSaves = {};
  }

  // initializeProfile(sessionID) {
  //   AccountController.profiles[sessionID] = {};
  //   dialogue_f.handler.initializeDialogue(sessionID);
  //   health_f.handler.initializeHealth(sessionID);
  //   insurance_f.handler.resetSession(sessionID);
  //   AccountController.loadProfileFromDisk(sessionID);
  //   // this.loadProfileFromDisk(sessionID);
  // }

  /**
   * Load the user profiled specified by sessionID from disk, generate a scav and set the profileFileAge variable as well as the skipeedSaves count.
   * @param {*} sessionID 
   * @returns {object}
   */
  loadProfileFromDisk(sessionID) {
    if (sessionID === undefined) {
      logger.throwErr("Session ID is undefined");
      return;
    }
    try {
      // Check if the profile file exists
      if (!global.internal.fs.existsSync(getPmcPath(sessionID))) {
        logger.logError(`Profile file for session ID ${sessionID} not found.`);
        return false;
      }

      //Load the PMC profile from disk.
      AccountController.profiles[sessionID]["pmc"] = fileIO.readParsed(getPmcPath(sessionID));

      // Set the file age for the users character.json.
      let stats = global.internal.fs.statSync(getPmcPath(sessionID));

      // Generate a scav
      AccountController.profiles[sessionID]["scav"] = this.generateScav(sessionID);
    } catch (e) {
      if (e instanceof SyntaxError) {
        return logger.logError(
          `There is a syntax error in the character.json file for AID ${sessionID}. This likely means you edited something improperly. Call stack: \n${e.stack}`
        );
      } else {
        logger.logData(sessionID);
        logger.logError(`There was an issue loading the user profile with session ID ${sessionID}. Call stack:`);
        logger.logData(e);
        return;
      }
    }
    logger.logSuccess(`Loaded profile for AID ${sessionID} successfully.`);
  }

  // /**
  //  * Reload the profile from disk if the profile was changed by another server.
  //  * @param {*} sessionID 
  //  */
  // reloadProfileBySessionID(sessionID) {
  //   if (sessionID === undefined) {
  //     logger.throwErr("Session ID is undefined");
  //     return;
  //   }
  //   try {

  //     // Check if the profile file exists
  //     if (global.internal.fs.existsSync(getPmcPath(sessionID))) {
  //         //Load the PMC profile from disk.
  //         AccountController.profiles[sessionID]["pmc"] = fileIO.readParsed(getPmcPath(sessionID));
        
  //         logger.logWarning(`Profile for AID ${sessionID} was modified elsewhere. Profile was reloaded successfully.`)
  //     }
  //   } catch (e) {
  //     if (e instanceof SyntaxError) {
  //       return logger.logError(
  //         `There is a syntax error in the character.json file for AID ${sessionID}. This likely means you edited something improperly. Call stack: \n${e.stack}`
  //       );
  //     } else {
  //       logger.logData(sessionID);
  //       logger.logError(`There was an issue loading the user profile with session ID ${sessionID}. Call stack:`);
  //       logger.logData(e);
  //       return;
  //     }
  //   }
  // }

  /**
   * Check if the sessionID is loaded.
   * @param {string} sessionID 
   */
  isLoaded(sessionID) {
    if (AccountController.profiles[sessionID]) {
      return true;
    }
    return false;
  }

  getOpenSessions() {
    return Object.keys(AccountController.profiles);
  }

  saveToDisk(sessionID) {
    // Check if a PMC character exists in the server memory.
    if ("pmc" in AccountController.profiles[sessionID]) {
      // Check if the profile path exists
      if (global.internal.fs.existsSync(getPmcPath(sessionID))) {

        // Compare the PMC character from server memory with the one saved on disk
        let currentProfile = AccountController.profiles[sessionID]['pmc'];
        let savedProfile = fileIO.readParsed(getPmcPath(sessionID));
        if (JSON.stringify(currentProfile) !== JSON.stringify(savedProfile)) {
          // Save the PMC character from memory to disk.
          fileIO.write(getPmcPath(sessionID), AccountController.profiles[sessionID]['pmc']);

          logger.logSuccess(`Profile for AID ${sessionID} was saved.`);
        } 
      } 
    }
  }

  /*
   * Get profile with sessionID of type (profile type in string, i.e. 'pmc').
   * If we don't have a profile for this sessionID yet, then load it and other related data
   * from disk.
   */
  // getProfile(sessionID, type) {
  //   if (!(sessionID in AccountController.profiles)) {
  //     this.initializeProfile(sessionID);
  //   } 
  //   // else {
  //   //   this.reloadProfileBySessionID(sessionID);
  //   // }

  //   return AccountController.profiles[sessionID][type];
  // }
  profileAlreadyCreated(ID) {
    return fileIO.exist(`user/profiles/${ID}/character.json`);
  }
  getProfileById(ID, type) {
    return fileIO.readParsed(`user/profiles/${ID}/character.json`);
  }
  getProfileExfilsById(ID) {
    return fileIO.readParsed(`user/profiles/${ID}/exfiltrations.json`);
  }
  setProfileExfilsById(ID, data) {
    return fileIO.write(`user/profiles/${ID}/exfiltrations.json`, data);
  }

  // getPmcProfile(sessionID) {
  //   return AccountController.getProfile(sessionID, "pmc");
  // }

  getScavProfile(sessionID) {
    const scavProfile = AccountController.getProfile(sessionID, "scav");
    scavProfile.Info.Settings.Role = "assault";
    return scavProfile;
  }

  setScavProfile(sessionID, scavData) {
    AccountController.profiles[sessionID]["scav"] = scavData;
  }

  getCompleteProfile(sessionID) {
    let output = [];

    if (!AccountController.isWiped(sessionID)) {
      output.push(profile_f.handler.getScavProfile(sessionID));
      output.push(AccountController.getPmcProfile(sessionID));
    }

    return output;
  }

  generateScav(sessionID) {
    let pmcData = AccountController.getPmcProfile(sessionID);
    let scavData = bots_f.generatePlayerScav(sessionID);

    scavData._id = pmcData.savage;
    scavData.aid = sessionID;

    // Set cooldown time.
    // Make sure to apply ScavCooldownTimer bonus from Hideout if the player has it.
    let currDt = Date.now() / 1000;
    let scavLockDuration = global._database.globals.config.SavagePlayCooldown;
    let modifier = 1;
    for (let bonus of pmcData.Bonuses) {
      if (bonus.type === "ScavCooldownTimer") {
        // Value is negative, so add.
        // Also note that for scav cooldown, multiple bonuses stack additively.
        modifier += bonus.value / 100;
      }
    }
    scavLockDuration *= modifier;
    scavData.Info.SavageLockTime = currDt + scavLockDuration;

    return scavData;
  }

  validateNickname(info, sessionID) {
    if (info.nickname.length < 3) {
      return "tooshort";
    }

    if (AccountController.nicknameTaken(info)) {
      return "taken";
    }

    return "OK";
  }

  changeNickname(info, sessionID) {
    let output = this.validateNickname(info, sessionID);

    if (output === "OK") {
      let pmcData = AccountController.getPmcProfile(sessionID);

      pmcData.Info.Nickname = info.nickname;
      pmcData.Info.LowerNickname = info.nickname.toLowerCase();
    }

    return output;
  }

  changeVoice(info, sessionID) {
    let pmcData = AccountController.getPmcProfile(sessionID);
    pmcData.Info.Voice = info.voice;
  }
}

function getPmcPath(sessionID) {
  let pmcPath = db.user.profiles.character;
  return pmcPath.replace("__REPLACEME__", sessionID);
}

function getStashType(sessionID) {
  let pmcData = AccountController.getPmcProfile(sessionID);

  for (let item of pmcData.Inventory.items) {
    if (item._id === pmcData.Inventory.stash) {
      return item._tpl;
    }
  }

  logger.logError(`No stash found where stash ID is: ${pmcData.Inventory.stash}`);
  return "";
}

function calculateLevel(pmcData) {
  let exp = 0;

  for (let level in global._database.globals.config.exp.level.exp_table) {
    if (pmcData.Info.Experience < exp) {
      break;
    }

    pmcData.Info.Level = parseInt(level);
    exp += global._database.globals.config.exp.level.exp_table[level].exp;
  }

  return pmcData.Info.Level;
}

module.exports.handler = new ProfileServer();
module.exports.getStashType = getStashType;
module.exports.calculateLevel = calculateLevel;
// module.exports.getLoyalty = getLoyalty;
