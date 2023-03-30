"use strict";

const { logger } = require("../../core/util/logger");
const { AccountController } = require('./../Controllers/AccountController')

class LocaleServer {
  constructor() {
    this.dataBase = global._database;
  }
  initialize() {
    if(global !== undefined && this.dataBase !== undefined) {
      this.dataBase.locales.global['en']
      .interface["Attention! This is a Beta version of Escape from Tarkov for testing purposes."] 
      = "Welcome to Stay In Tarkov, an Escape from Tarkov emulator.";
      this.dataBase.locales.global['en']
      .interface["NDA free warning"] = "You MUST have a legal copy of the game for this mod to work. Please support the game developers!";
      this.dataBase.locales.global['en']
      .interface["Offline raid description"] 
      = "You are now entering an emulated version of a Tarkov raid. This emulated raid has all the features of a live version, but it has no connection to BSG's servers, and stays local on your PC.\nOther PMCs will spawn as emulated AI, and will spawn with randomized gear, levels, inventory, and names. This means you can loot, kill, and extract as you would online, and keep your inventory when you extract, but you cannot bring this loot into live EFT servers.";

      // _database.locales.global['ru'].interface["Attention! This is a Beta version of Escape from Tarkov for testing purposes."] = "Внимание! Это оффлайн версия игры \"Escape from Tarkov\", предоставленная командой JustEmuTarkov (justemutarkov.eu).";
      // _database.locales.global['ru'].interface["NDA free warning"] = "Поддержите создателей Escape From Tarkov - BattleState Games, если вам нравится эта игра.";
      // _database.locales.global['ru'].interface["Offline raid description"] = "Вы входите в оффлайн версию рейда. Он включает в себя все возможности оффициальной версии, но не имеет подключения к серверам BSG и работает локально на вашем ПК.\nДругие ЧВК появятся как ИИ и будут иметь случайное снаряжение, уровень, инвентарь и имена. Вы можете собирать лут, убивать других ЧВК и выходить с рейда так-же, как в онлайн версии, ваш инвентарь будет сохранен при выходе, но вы не можете перенести ваши вещи на оффициальную версию или наоборот.\nЕсли у вас есть вопросы, то присоедитесь к Discord серверу JustEmuTarkov.";
    }
  }

  getLanguages() {
    return global._database.languages;
  }

  getMenu(lang, url, sessionID) {
    const currentLang = url.replace("/client/locale/", "");
    const account = AccountController.find(sessionID);
    lang = currentLang;

    if (account.lang != lang) account.lang = lang;
    if (utility.isUndefined(global._database.locales.menu[lang]))
      return global._database.locales.menu["en"];
    return global._database.locales.menu[lang];
  }

  getGlobal(lang, url, sessionID) {
    let currentLang;
    if (url) {
      currentLang = url.replace("/client/locale/", "");
    } else {
      if (lang) {
        currentLang = lang;
      } else {
        currentLang = AccountController.getLanguages(sessionID);
      }

      const account = AccountController.find(sessionID);
      lang = currentLang;
      if (account.lang.includes("/client/locale/") && account.lang != lang) 
        account.lang = lang;
    }
    if (!currentLang){
      logger.logError("No language found for global");
    }
    
    if (utility.isUndefined(global._database.locales.global[lang]))
      return global._database.locales.global["en"];
    return global._database.locales.global[lang];
  }
}

module.exports.handler = new LocaleServer();