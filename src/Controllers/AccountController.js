const fs = require('fs');
const utility = require('./../../core/util/utility');
const { logger } = require('../../core/util/logger');
const dialogue = require('../classes/dialogue');

/**
 * Account Controller. 
 * This controller should contain everything to handle Account data
 */
class AccountController
{
  static accounts = {};
  static accountFileAge = {};
  static profiles = {};


  static Instance = new AccountController();

  // static accounts = {};

   constructor() {
    if(!fs.existsSync(`user/profiles/`)) {
      fs.mkdirSync(`user/profiles/`);
    }
  }

  /**
   * Tries to find account data in loaded account list if not present returns undefined
   * @param {*} sessionID 
   * @returns Account_data
   */
    static find(sessionID) {



      AccountController.reloadAccountBySessionID(sessionID);
      for (let accountID in AccountController.accounts) {
        let account = AccountController.accounts[accountID];
  
        if (account.id === sessionID) {
          return account;
        }
      }
  
      return undefined;
    }
    /**
     * Gets ALL of the account data from every profile in the user/profiles directory
     * @returns all the Account data neccessary to process accounts in the server & client
     */
    static getAllAccounts() {
        let fullyLoadedAccounts = [];
        if(!fs.existsSync(`user/profiles/`)) {
          fs.mkdirSync(`user/profiles/`);
        }
      
          const profileFolders = fs.readdirSync(`user/profiles/`);
      // console.log(profileFolders);
      
          // let ids = Object.keys(AccountController.accounts);
          // for (let i in ids) {
          for (const id of profileFolders) {

            AccountController.reloadAccountBySessionID(id);
            AccountController.initializeProfile(id);

              // let id = ids[i];
              if (!fileIO.exist(`user/profiles/${id}/character.json`)) continue;
              const character = fileIO.readParsed(`user/profiles/${id}/character.json`);

              let obj = {
                  Info: {}
              };
      
              let profile = AccountController.getPmcProfile(character.aid);
              
              obj.Id = character.aid;
              obj._id = character.aid;
              obj.Nickname = character.Info.Nickname;
              obj.Level = character.Info.Level;
              obj.lookingGroup = false;
              if(character.matching !== undefined) {
                  obj.lookingGroup = character.matching.lookingForGroup;
              }
              obj.Info.Nickname = character.Info.Nickname;
              obj.Info.Side = character.Info.Side;
              obj.Info.Level = character.Info.Level;
              obj.Info.MemberCategory = character.Info.MemberCategory;
              obj.Info.Ignored = false;
              obj.Info.Banned = false;
              obj.PlayerVisualRepresentation = {
                  Info: obj.Info,
                  Customization: character.Customization,
                  // Equipment: character.Inventory.Equipment
                  // Equipment: character.Inventory
              };
              // obj.PlayerVisualRepresentation = profile;
              fullyLoadedAccounts.push(obj);
          }
      
          // console.log(fullyLoadedAccounts);
          return fullyLoadedAccounts;
        }

        static reloadAccountBySessionID(sessionID) {
          if (!fileIO.exist(`./user/profiles/${sessionID}/account.json`)) {
            // logger.logWarning(`Account file for account ${sessionID} does not exist.`);
          } else {
            // Does the session exist?
            if (AccountController.accounts[sessionID] === undefined) {
              logger.logWarning(`Tried to load session ${sessionID} but it wasn't cached, loading.`);
              // Reload the account from disk.
              AccountController.accounts[sessionID] = fileIO.readParsed(`./user/profiles/${sessionID}/account.json`);
            } 
            // else {
            //   // Reload the account from disk.
            //   AccountController.accounts[sessionID] = fileIO.readParsed(`./user/profiles/${sessionID}/account.json`);
            // }
          }
        }

        static isWiped(sessionID) {
          // AccountController needs to be at the top to check for changed accounts.
          AccountController.reloadAccountBySessionID(sessionID);
          return AccountController.accounts[sessionID].wipe;
        }

        static getReservedNickname(sessionID) {
          AccountController.reloadAccountBySessionID(sessionID);
          return "";
        }
      
        static nicknameTaken(info) {
          // AccountController will be usefull if you dont want to have same nicknames in accounts info otherwise leave it to always false
          // for (let accountID in AccountController.accounts) {
            // if (info.nickname.toLowerCase() === AccountController.accounts[accountID].nickname.toLowerCase()) {
              // return true;
            // }
          // }
      
          return false;
        }

    static findAccountIdByUsernameAndPassword(username, password) {
      if(!fs.existsSync(`user/profiles/`)) {
        fs.mkdirSync(`user/profiles/`);
      }

      const profileFolders = fs.readdirSync(`user/profiles/`);
        for (const id of profileFolders) {
            if (!fileIO.exist(`user/profiles/${id}/account.json`)) continue;
            let account = JSON.parse(fs.readFileSync(`user/profiles/${id}/account.json`));
            if(account.email == username && account.password == password) {
              const profile = AccountController.getPmcProfile(id);

              return id;
            }
        }
      return undefined;
    }

    static isEmailAlreadyInUse(username) {
      if(!fs.existsSync(`user/profiles/`)) {
        fs.mkdirSync(`user/profiles/`);
      }

      const profileFolders = fs.readdirSync(`user/profiles/`);
          for (const id of profileFolders) {
              if (!fileIO.exist(`user/profiles/${id}/account.json`)) continue;
              let account = JSON.parse(fs.readFileSync(`user/profiles/${id}/account.json`));
              if(account.email == username)
                return true;
          }

      return false;
    }

    /**
     * 
     * @param {object} info 
     */
    static login(info) {
        // AccountController.reloadAccountByLogin(info);
        const loginSuccessId = AccountController.findAccountIdByUsernameAndPassword(info.username, info.password);
        if(loginSuccessId !== undefined) {
          logger.logSuccess(`Login ${loginSuccessId} Successful`)
        }
        return loginSuccessId;
    }

    static register(info) {
      if(!fs.existsSync(`user/profiles/`)) {
        fs.mkdirSync(`user/profiles/`);
      }

      // Get existing account from memory or cache a new one.
      let accountID = AccountController.findAccountIdByUsernameAndPassword(info.username, info.password);
      if (accountID !== undefined) {
        return accountID
      }

      if(this.isEmailAlreadyInUse(info.username)) {
        return "ALREADY_IN_USE";
      }

      if(accountID === undefined) {
          accountID = utility.generateNewAccountId();
          if(accountID === undefined || accountID === "") {
            return "FAILED";
          }
      
          AccountController.accounts[accountID] = {
            id: accountID,
            email: info.email,
            password: info.password,
            wipe: true,
            edition: info.edition,
            lang: "en",
	          friends: [],
	          Matching: {
              "LookingForGroup": false
            },
	          friendRequestInbox: [],
	          friendRequestOutbox: []
          };
      
          AccountController.saveToDisk(accountID);
          return accountID;
        }
    }

    static getPmcPath(sessionID) {
      const path = `${process.cwd()}/user/profiles/${sessionID}/character.json`;
      // console.log(path);
      return path;
    }

    /*
   * Get profile with sessionID of type (profile type in string, i.e. 'pmc').
   * If we don't have a profile for this sessionID yet, then load it and other related data
   * from disk.
   */
  static getProfile(sessionID, type) {
    if (AccountController.profiles[sessionID] === undefined) {
      AccountController.initializeProfile(sessionID);
    } else {
      // AccountController.reloadProfileBySessionID(sessionID);
    }

    return AccountController.profiles[sessionID][type];
  }

  static getPmcProfile(sessionID) {
    return AccountController.getProfile(sessionID, "pmc");
  }

  static getCompleteProfile(sessionID) {
    let output = [];

    if (!AccountController.isWiped(sessionID)) {
      const scavProf = profile_f.handler.getScavProfile(sessionID);
      scavProf.Info.Settings.Role = "assault";
      output.push(scavProf);
      // output.push(AccountController.getPmcProfile(sessionID));
      output.push(AccountController.getPmcProfile(sessionID));
    }

    return output;
  }

    static initializeProfile(sessionID) {
      if(sessionID === undefined || sessionID === "")
        return;

      if(AccountController.profiles[sessionID] !== undefined)
        return;

      AccountController.profiles[sessionID] = {};
      dialogue_f.handler.initializeDialogue(sessionID);
      health_f.handler.initializeHealth(sessionID);
      insurance_f.handler.resetSession(sessionID);
      AccountController.loadProfileFromDisk(sessionID);
    }
  
    /** Load the user profiled specified by sessionID from disk, generate a scav and set the profileFileAge variable as well as the skipeedSaves count.
     * @param {*} sessionID 
     * @returns {object}
     */
    static loadProfileFromDisk(sessionID) {
      if (sessionID === undefined) 
        logger.throwErr("Session ID is undefined");

      try {
        // Check if the profile file exists
        if (!fs.existsSync(AccountController.getPmcPath(sessionID))) {
          logger.logError(`Profile file for session ID ${sessionID} not found.`);
          return false;
        }
  
        // --------------------------------------------------------
        //Load the PMC profile from disk.
        let loadedProfile = fileIO.readParsed(AccountController.getPmcPath(sessionID));
        // --------------------------------------------------------

        // --------------------------------------------------------
        // Fix the GUID system used by JET and replace with MongoId
        loadedProfile = AccountController.ChangeGuidToMongo(loadedProfile);
        // --------------------------------------------------------
        
        // In patch 0.12.12.30 . BSG introduced "Special Slots" for PMCs.
        // To cater for old/broken accounts, we remove the old "Pockets" (557ffd194bdc2d28148b457f) and replace with the new (627a4e6b255f7527fb05a0f6)
        loadedProfile = AccountController.AddSpecialSlotPockets(loadedProfile);

        // --------------------------------------------------------
        // Add Repeatable Quests
        loadedProfile = AccountController.AddRepeatableQuestsProperty(loadedProfile);
        // --------------------------------------------------------
        
        // --------------------------------------------------------
        // Add Ragfair Info
        loadedProfile = AccountController.AddRagfairInfoProperty(loadedProfile);
        // --------------------------------------------------------
        
       
        AccountController.profiles[sessionID]["pmc"] = loadedProfile;

        // ---------------------------------- 
        loadedProfile = AccountController.FixTradersInfo(loadedProfile);
  
        // Generate a scav
        AccountController.profiles[sessionID]["scav"] = profile_f.handler.generateScav(sessionID);
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

    /**
   * If the sessionID is specified, AccountController function will save the specified account file to disk, if the file wasn't modified elsewhere and the current memory content differs from the content on disk.
   * @param {*} sessionID 
   */
  static saveToDisk(sessionID, force = false, releaseMemory = false) {

    if(sessionID === undefined)
      return;

    if(!fs.existsSync(`user/profiles/`)) {
      fs.mkdirSync(`user/profiles/`);
    }

    AccountController.saveToDiskAccount(sessionID, force);
    AccountController.saveToDiskProfile(sessionID, force);
    dialogue.handler.saveToDisk(sessionID);
    if(releaseMemory) {
      delete AccountController.accounts[sessionID];
      delete AccountController.profiles[sessionID];
      logger.logSuccess(sessionID + " has been released from memory.")
    }
  }

  static saveToDiskAccount(sessionID, force = false) {
    // Does the account file exist? (Required for new accounts)
    if (!fileIO.exist(`./user/profiles/${sessionID}/account.json`)) {
      logger.logInfo(`Registering New account ${sessionID}.`);
      fileIO.write(`./user/profiles/${sessionID}/account.json`, AccountController.accounts[sessionID]);
      logger.logSuccess(`New account ${sessionID} has been registered.`);
    } else {
      let currentAccount = AccountController.accounts[sessionID];
      let savedAccount = fileIO.readParsed(`./user/profiles/${sessionID}/account.json`);
      if (force || JSON.stringify(currentAccount) !== JSON.stringify(savedAccount)) {
        // Save memory content to disk
        fileIO.write(`./user/profiles/${sessionID}/account.json`, AccountController.accounts[sessionID]);
        logger.logSuccess(`${sessionID} Account was saved.`);
      }
    }
  }

    static saveToDiskProfile(sessionID, force = false)  {
      // Check if a PMC character exists in the server memory.
      if (AccountController.profiles[sessionID] === undefined) {
        // logger.logError(`Profile ${sessionID} doesn't exist in memory`);
        return;
      }

      const profilePath = AccountController.getPmcPath(sessionID);
      let prof = AccountController.getPmcProfile(sessionID);
      if(prof && fs.existsSync(profilePath)) {

        const profRawData = fs.readFileSync(profilePath);
        if(!profRawData || profRawData.buffer === undefined || profRawData.byteLength === 0)
          return;

        const parsedData = JSON.parse(profRawData);
        if(!parsedData)
          return;

        const diskProf = JSON.stringify(parsedData);

        if(force || diskProf !== JSON.stringify(prof)) {
          fileIO.write(profilePath, prof);
          logger.logSuccess(`${sessionID} Profile was saved.`);
        }
      }
    }

    /**
     * In patch 0.12.12.30 . BSG introduced "Special Slots" for PMCs.
     * To cater for old/broken accounts, we remove the old "Pockets" (557ffd194bdc2d28148b457f) and replace with the new (627a4e6b255f7527fb05a0f6)
     * @param {*} profile 
     * @returns {object} profile
     */
    static AddSpecialSlotPockets(profile) {

      // In patch 0.12.12.30 . BSG introduced "Special Slots" for PMCs.
      // To cater for old/broken accounts, we remove the old "Pockets" (557ffd194bdc2d28148b457f) and replace with the new (627a4e6b255f7527fb05a0f6)
      const preSpecialSlotPocketsIndex = profile.Inventory.items.findIndex(x=>x._tpl === "557ffd194bdc2d28148b457f");
      if(preSpecialSlotPocketsIndex !== -1) {
        profile.Inventory.items = profile.Inventory.items.filter(x => x._tpl !== "557ffd194bdc2d28148b457f")
        let addedSpecialItems = profile.Inventory.items.findIndex(x=>x._tpl === "627a4e6b255f7527fb05a0f6") === -1;
        if(addedSpecialItems) {
          profile.Inventory.items.push({
            "_id": utility.generateNewId(undefined, 3),
            "_tpl": "627a4e6b255f7527fb05a0f6",
            "parentId": profile.Inventory.equipment,
            "slotId": "Pockets"
          });
          logger.logSuccess(`Login added Special Items Pockets`);
        }
      }
      return profile;

    }

    /**
     * This is a hack to fix TradersInfo until we figure out the real cause of the problem
     * ISSUE: The issue is that some Traders sell as "saleSum", others "salesSum", which is stupid
     * @param {*} profile 
     * @returns 
     */
    static FixTradersInfo(profile) {

      let fixesApplied = false;
      for(const id in profile.TradersInfo) {
        const tInfo = profile.TradersInfo[id];
        if(tInfo.salesSum === undefined || tInfo.salesSum === null) {
          tInfo.salesSum = 0;
          fixesApplied = true;
        }
        if(tInfo.standing === undefined || tInfo.standing === null) {
          tInfo.standing = 0;
          fixesApplied = true;
        }
      }
      if(fixesApplied) {
        AccountController.saveToDiskProfile(profile.aid);
      }

      return profile;
    }

    /** Fix the GUID system used by JET and replace with MongoId
     * @param {*} profile 
     * @returns {object} profile
     */
    static ChangeGuidToMongo(loadedProfile) {
      const changedIds = {};
        for(const item of loadedProfile.Inventory.items) {
          if(item._id.length > 24) {
            const oldId = item._id;
            const newId = utility.generateNewId(undefined, 3);
            console.log(`${oldId} is becoming ${newId}`);
            changedIds[oldId] = newId;
            item._id = newId;
          }
        }
        for(const item of loadedProfile.Inventory.items) {
          if(changedIds[item.parentId] !== undefined) {
            item.parentId = changedIds[item.parentId];
          }
        }
        if(Object.keys(changedIds).length > 0) {
          logger.logSuccess(`Login cleaned ${Object.keys(changedIds).length} items`);
        }
        return loadedProfile;
    }

    /** Adds the "RepeatableQuests" property to the profile
     * @param {*} pmcProfile 
     * @returns {object} profile
     */
    static AddRepeatableQuestsProperty(profile)
    {
        if (!profile.RepeatableQuests)
        {
          profile.RepeatableQuests = [];
        }
        return profile;
    }

    /** Adds the "RagfairInfo" property to the profile
     * @param {*} pmcProfile 
     * @returns {object} profile
     */
     static AddRagfairInfoProperty(profile)
     {
        if (!profile.RagfairInfo) {
          profile.RagfairInfo = { offers: [], rating: 0, isRatingGrowing: false };
        }

        if(profile.FleaOffers && profile.FleaOffers.length > 0) {
          profile.RagfairInfo.offers = [...profile.RagfairInfo.offers, ...profile.FleaOffers];

        }
        return profile;
     }

    /** Create character profile
   * 
   * @param {*} info 
   * @param {*} sessionID 
   */
  static createProfile(info, sessionID) {
// console.log("createProfile");
// console.log(info);

    // Load account data //
    const account = AccountController.find(sessionID);

    // Get profile location //
    const folder = AccountController.getPath(account.id);

    // Get the faction the player has chosen //
    const ChosenSide = info.side.toLowerCase();

    // Get the faction the player has chosen as UpperCase String //
    const ChosenSideCapital = ChosenSide.charAt(0).toUpperCase() + ChosenSide.slice(1);

    // Get the profile template for the chosen faction //
    // let pmcData = fileIO.readParsed(db.profile[account.edition]["character_" + ChosenSide]);
    // let pmcData = JSON.parse(fs.readFileSync(process.cwd() + "/db/profile/Edge Of Darkness/character_usec.json"));
    let pmcData = JSON.parse(fs.readFileSync(process.cwd() + `/db/profile/Edge Of Darkness/character_${ChosenSide}.json`));

    // Initialize the clothing object //
    let storage = { _id: "", suites: [] };

    // delete existing profile
    // if (this.profiles[account.id]) {
    //   delete this.profiles[account.id];
    //   events.scheduledEventHandler.wipeScheduleForSession(sessionID);
    // }

    // Set defaults for new profile generation //
    // pmcData._id = "pmc" + account.id;
    pmcData._id = account.id;
    pmcData.aid = account.id;
    pmcData.savage = "scav" + account.id;
    pmcData.Info.Side = ChosenSideCapital;
    pmcData.Info.Nickname = info.nickname;
    pmcData.Info.LowerNickname = info.nickname.toLowerCase();
    pmcData.Info.Voice = customization_f.getCustomization()[info.voiceId]._name;
    pmcData.Customization = fileIO.readParsed(db.profile.defaultCustomization)[ChosenSideCapital]
    pmcData.Customization.Head = info.headId;
    pmcData.Info.RegistrationDate = ~~(new Date() / 1000);
    pmcData.Health.UpdateTime = ~~(Date.now() / 1000);

    // Load default clothing into the profile //
    let def = fileIO.readParsed(db.profile[account.edition].storage);
    storage = { err: 0, errmsg: null, data: { _id: pmcData._id, suites: def[ChosenSide] } };

    // Write the profile to disk //
    fileIO.write(`${folder}character.json`, pmcData);
    fileIO.write(`${folder}storage.json`, storage);
    fileIO.write(`${folder}userbuilds.json`, {});
    fileIO.write(`${folder}dialogue.json`, {});
    fileIO.write(`${folder}exfiltrations.json`, { bigmap: 0, develop: 0, factory4_day: 0, factory4_night: 0, interchange: 0, laboratory: 0, lighthouse: 0, rezervbase: 0, shoreline: 0, suburbs: 0, tarkovstreets: 0, terminal: 0, town: 0, woods: 0, privatearea: 0 });

    pmcData = AccountController.AddSpecialSlotPockets(pmcData);

    // don't wipe profile again //
    // AccountController.setWipe(account.id, false);
    account.wipe = false;
    AccountController.initializeProfile(sessionID);
    AccountController.profiles[sessionID]["scav"] = bots_f.botHandler.generate({conditions: [{ Role: "playerscav", Limit: 1 }]}, sessionID)[0];
    AccountController.profiles[sessionID]["pmc"] = pmcData;
    // AccountController.saveToDisk(sessionID);
  }

  /**
   * Check if the client has a profile. AccountController function will be used by the response "/client/game/start" and determine, if a new profile will be created.
   * @param {*} sessionID 
   * @returns If the account exists.
   */
   static clientHasProfile(sessionID) {
    AccountController.reloadAccountBySessionID(sessionID)
    let accounts = AccountController.getList();
    for (let account in accounts) {
      if (account == sessionID) {
        if (!fileIO.exist("user/profiles/" + sessionID + "/character.json")) logger.logSuccess(`New account ${sessionID} logged in!`);
        return true
      }
    }
    return false
  }

  static getList() {
    return AccountController.accounts;
  }

  static getPath(sessionID) {
    return `user/profiles/${sessionID}/`;
  }

  static wipe(info) {
    let accountID = AccountController.login(info);

    if (accountID !== "") {
      AccountController.accounts[accountID].edition = info.edition;
      AccountController.accounts[accountID].wipe = true;
      // AccountController.setWipe(accountID, true);
      AccountController.saveToDisk(accountID);
    }

    return accountID;
  }

  static remove(info) {
    let accountID = AccountController.login(info);

    if (accountID !== "") {
      delete AccountController.accounts[accountID];
      utility.removeDir(`user/profiles/${accountID}/`);
      //AccountController.saveToDisk();
    }

    return accountID;
  }

  static changeEmail(info) {
    let accountID = AccountController.login(info);

    if (accountID !== "") {
      AccountController.accounts[accountID].email = info.change;
      AccountController.saveToDisk(accountID);
    }

    return accountID;
  }

  static changePassword(info) {
    let accountID = AccountController.login(info);

    if (accountID !== "") {
      AccountController.accounts[accountID].password = info.change;
      AccountController.saveToDisk(accountID);
    }

    return accountID;
  }

  /**
 * Searches for account and tries to retrive the account language
 * @param {string} sessionID 
 * @returns {string} - Account language (en, ru...)
 */
   static getAccountLang(sessionID) {
    // AccountController needs to be at the top to check for changed accounts.
    // AccountController.reloadAccountBySessionID(sessionID);
    let account = AccountController.find(sessionID);
    if (account.lang === undefined || account.lang === "") {
      account.lang = "en";
      AccountController.saveToDisk(sessionID);
    }
    return account.lang;
  }

  /**
   * Reload the profile from disk if the profile was changed by another server.
   * @param {*} sessionID 
   */
   static reloadProfileBySessionID(sessionID) {
    if(AccountController.profiles[sessionID] === undefined) {

      if (fs.existsSync(AccountController.getPmcPath(sessionID))) {
          //Load the PMC profile from disk.
          AccountController.profiles[sessionID]["pmc"] = fileIO.readParsed(AccountController.getPmcPath(sessionID));
      }
    }
   
  }
}

module.exports.AccountController = AccountController;
