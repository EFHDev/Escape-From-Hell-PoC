"use strict";
const chalk = require(`chalk`)
const sshItem = require("./content/barter/ssh_barter.js");
const pda = require("./content/barter/barter_pda.js");
const AtlasStone = require("./content/barter/atlas_stone");
const UnlockTradersClass = require("./configer/unlockTraders.js");
const Items = require('./QOL/Items.js');
const QoLInspectInfo = require("./QoL/MoreItemInfo");
const AddPlayerNameToBotPool = require("./content/Fun/addPlayernameToBotNamePool");
const CreateIllegallGuns = require("./content/weapons/IllegalModifcations")
const config = require("./config.json");
const EFHMOD = require('./efh-mod');
const logger = require("./efh-mod");
const ImprovisedArmor = require(`./content/armor/improvised_armor.js`)
const Box = require("./content/Storage/Box")
const RationCard = require("./content/barter/RationCard.js")
const { KeycardRevamp } = require("./content/Keycards/KeycardSystem.js")

function onLoadMod() {
  global.logger = require(EFHMOD.logger).logger;
  if (!config?.poems == false) {
    //console.log(chalk.white.bold('[EF') + chalk.red.bold('H') + chalk.white.bold(']'))
    console.log(chalk.greenBright.bold`
      ******** ******** **      **         ******    *******   *******   ********
     /**///// /**///// /**     /**        **////**  **/////** /**////** /**///// 
     /**      /**      /**     /**       **    //  **     //**/**   /** /**      
     /******* /******* /**********      /**       /**      /**/*******  /******* 
     /**////  /**////  /**//////**      /**       /**      /**/**///**  /**////  
     /**      /**      /**     /**      //**    **//**     ** /**  //** /**      
     /********/**      /**     /**       //******  //*******  /**   //**/********
     //////// //       //      //         //////    ///////   //     // //////// "
     Thank you for playing! `
    );
    // Configs

    // Items 
    CreateIllegallGuns.AddWeapons();
    sshItem.onLoadMod();
    pda.onLoadMod();
    AtlasStone.onLoadMod();
    ImprovisedArmor.onLoadMod();
    Box.onLoadMod();
    RationCard.onLoadMod();
    KeycardRevamp.onModLoad()


    // QOL //
    Items.adjustItems();
    QoLInspectInfo.ItemRarityByColor();
    QoLInspectInfo.AddPenDamagetoDesc();
    AddPlayerNameToBotPool.AddNames();

    if (config.qol.FasterProduction)
      Items.FasterHideoutProduction();
    if (config.qol.unlockTraders)
      UnlockTradersClass.UnlockTradersByDefault();

  }
}

class Mod {//It could, since this is technickly the first thing loaded? but theres no defanition for ID here
  constructor() {
    //Logger.info("Kestrel-EFH"); // i think it has to do with this `maybe` because Logger doesn't exist
    ModLoader.onLoad["Kestrel-EFH"] = onLoadMod;
  }
}

module.exports.Mod = new Mod();