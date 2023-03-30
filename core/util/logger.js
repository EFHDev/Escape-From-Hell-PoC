"use strict";
const utility = require('./utility');
const util = require("util");
const fileIO = require('./fileIO');
const serverConfig = require("../../user/configs/server_base.json")
// Made by TheMaoci ~2019

// colorData[0] -> front, colorData[1] -> back
const colorData = [
  {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },
  {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  },
];

class Logger {
  constructor() {
    let file = utility.getDate() + "_" + utility.getTime() + ".log";
    
    if (!fileIO.exist('user')) {
      fileIO.mkDir('user');
    }

    let folder = "user/logs/";
    let filepath = folder + file;

    // create log folder
    if (!fileIO.exist(folder)) {
      fileIO.mkDir(folder);
    }

    // create log file
    if (!fileIO.exist(filepath)) {
      fileIO.write(filepath, "");
    }

    this.fileStream = fileIO.createWriteStream(filepath);
  }

  log(type, data, colorFront = "", colorBack = "") {
    let setColors = "";
    let colors = ["", ""];

    if (colorFront !== "") {
      colors[0] = colorFront;
    }

    if (colorBack !== "") {
      colors[1] = colorBack;
    }

    // properly set colorString indicator
    for (let i = 0; i < colors.length; i++) {
      if (colors[i] !== "") {
        setColors += colorData[i][colors[i]];
      }
    }

    let date = new Date().toISOString().
      replace(/T/, ' ').
      replace(/\..+/, '');

    let deltaTime = serverConfig.debugTimer ? "[" + date + "] " : " ";

    // print data
    if (colors[0] !== "" || colors[1] !== "") {
      if (type != "" && type != "LogData") console.log(setColors + type + "\x1b[0m" + deltaTime + data);
      else console.log(setColors + data + "\x1b[0m");
    } else {
      if (type != "" && type != "LogData") console.log(type + deltaTime + data);
      else console.log(data);
    }

    // write the logged data to the file
    if (type == "LogData") {
      this.fileStream.write(util.format(data));
      this.fileStream.write(util.format("\n")); //just new line
    } else {
      this.fileStream.write(util.format(deltaTime + type + "-" + data + "\n"));
    }
  }

  logError(text) {
    this.log("!", text, "white", "red");
  }

  logWarning(text) {
    this.log("!", text, "black", "yellow");
  }

  logSuccess(text) {
    this.log(".", text, "white", "green");
  }

  logDebug(text) {
    this.log("D", text, "white", "magenta");
  }

  logInfo(text) {
    if (!serverConfig.hideInfoLogs) this.log(".", text, "white", "blue");
  }
  logDebug(text) {
    if (serverConfig.showDebugLogs) this.log("D", text, "white", "magenta");
  }
  logRequest(text, data = "") {
    if (data == "") this.log("", text, "cyan", "black");
    else this.log(data, text, "cyan", "black");
  }

  logData(data, deep = false) {
    if (deep) data = internal.util.inspect(data, { showHidden: false, depth: null });
    this.log("LogData", data);
  }

  throwErr(message, where, additional = "") {
    throw message + "\r\n" + where + (additional != "" ? `\r\n${additional}` : "");
  }
}

module.exports.logger = new Logger();