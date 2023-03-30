//plt_armr was here lel
// AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA THIS WAS MENT TO BE EASIER THEN IT WAS. THE MOD LOADS BEFORE ALL THE FUNCTIONSSSS
"use strict";
const EFHMOD = require('../../efh-mod');
const fs = require('fs')
const logger = require(EFHMOD.logger).logger;
const config = require('../../config.json');
const NameDatabase = require("../../../../../db/base/botNames.json")
const bots = DatabaseServer.tables.bots;

/**
* Adds the player's nickname to the botpools using hook into AccountController.getAllAccounts, 
*/
class AddPlayerNameToBotPool {
    static AddNames() {
        const playerNames = this.GetPlayerAllNames();

        const length = playerNames.length;
        for (let i = 0; i < length; i++) {
            const playerName = playerNames[i];
            this.GetPlayerTitles(playerName);
        }
    }

    /**
    * Prases all profiles using fs/jsonutil and gets the line for "nickname", and outputs it as Character.info.NickName, 
    */
    static GetPlayerAllNames() {
        const output = [];
        if (!fs.existsSync(`user/profiles/`)) { // check if profiles exist
            logger.logDebug(`[GetPlayerAllNames] AINT NO PROFILES YOU FUCKIN FOOL!!!!!!`);
            return;
        }

        const profileFolders = fs.readdirSync(`user/profiles/`);
        for (const id of profileFolders) {
            if (!fs.existsSync(`user/profiles/${id}/character.json`)) { //check if character.json exists
                logger.logDebug(`[GetPlayerAllNames] Character has not been created, skipping!`);
                continue;
            }
            //utf8 is some encoding shit for JS idk really, just needs it LMAO
            const character = JSON.parse(fs.readFileSync(`user/profiles/${id}/character.json`, 'utf8')); // what in good gods name is utf8
            if (Object.keys(character).length === 0) { //if character has 0 properties/keys, it isn't generated
                logger.logDebug(`[GetPlayerAllNames] Character has not been generated, skipping!`);
                continue;
            }
            output.push(character.Info.Nickname); //push nickname to array
        }
        return output; //return array of names
    }

    /**
    * Gets the titles set in config.json.fun.PlayerTitles. 
    */
    static GetPlayerTitles(playerName) {
        const playerTitles = config.fun.playerNameTitles; //array of names

        const length = playerTitles.length;
        for (let i = 0; i < length; i++) {
            const playerTitle = playerTitles[i];
            this.AddName(playerTitle, playerName);
        }
    }

    /**
     * Adds the name to the bots name-pool via push 
     */
    static AddName(playerTitle, playerName) {
        const sides = config.fun.sidesToAddNamesTo;

        const length = sides.length;
        for (let i = 0; i < length; i++) {
            const side = this.GetSide(sides[i].toLowerCase());

            if (!side) {
                logger.logDebug(`Side is undefined, loser!!!!!!!!!!!!!`)
                continue;
            }

            if (!bots.names[side]) {
                logger.logDebug(`${side} does not exist in bots.names, loser!!!!!!!`);
                continue;
            }

            const name = `${playerTitle} ${playerName}`;
            if (config.debug.deepdebug)
                logger.logDebug(`${name} being added to bots.names.${side}`);

            bots.names[side].push(name);
        }
    }

    /**
    * Get proper side because people can't follow rules!!!!!!!!!!!!!! 
    */
    static GetSide(side) {
        if (["usec", "bear", "pmcbot"].includes(side))  // if usec or bear
            return "normal";

        for (const type in bots.names) {
            const lowerCase = type.toLowerCase();
            if (lowerCase !== side)
                continue;

            return type;
        }

        logger.logDebug(`[GetSide] Side ${side} does not exist in bot.names`);
        return false;
    }
}

module.exports = AddPlayerNameToBotPool;