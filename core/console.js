const { AccountController } = require("../src/Controllers/AccountController");

let debugSessionEnabled;
let debugSession;

class ConsoleResponse {
  constructor() {
    debugSessionEnabled = false;
    debugSession = "";
    this.readline = require("readline");
    this.rl = this.readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.rl.on("line", (input) => {
      if (input.startsWith("/")) {
        // command found?
        input = input.substring(1);
        const commandStructure = input.split(" ");
        if (typeof this.commands[commandStructure[0]] != "undefined") {
          this.commands[commandStructure[0]](commandStructure);
        }
      }
    });

    this.commands = {
      // add command below !!
      restart: this.resetServer,
      register: this.registerAccount,
      info: this.displayInfo,
      help: this.displayInfo,
      h: this.displayInfo,
      addItem: this.addItem,
      devSession: this.setDebugSession,
    };
    this.commandsInfo = {
      // add command below !!
      restart: "restarting the server softly",
      register: "( /register login editionNumber password ) - edition & password not required",
      info: "",
      addItem: "( /addItem MySession TemplateId Amount)",
      devSession: "( /devSession true MySessionToChange ) ",
    };
    this.commandsInfo["help"] == this.commandsInfo["info"];
    this.commandsInfo["h"] == this.commandsInfo["info"];
  }
  getSession() {
    return debugSession;
  }
  getDebugEnabled() {
    return debugSessionEnabled;
  }
  addCommand(commandName, commandDescription, _function) {
    this.commands[commandName] = _function;
    this.commandsInfo[commandName] = commandDescription;
  }
  removeCommand(commandName) {
    delete this.commands[commandName];
    delete this.commandsInfo[commandName];
  }
  // commands below !!
  setDebugSession(commandStructure) {
    let enabled = commandStructure[1];
    let session = commandStructure[2];
    debugSessionEnabled = enabled;
    debugSession = session;
    console.log(`Dev Session Handler: ${debugSessionEnabled} - ${debugSession}`);
  }
  addItem(commandStructure) {
    /*
      1 - sessionID
      2 - itemID
      3 - amount
    */
    let sessionID = commandStructure[1];
    let newItemList = { items: [{ item_id: commandStructure[2], count: commandStructure[3] }], tid: "" };
    let pmcData = AccountController.getPmcProfile(sessionID);
    move_f.addItem(pmcData, newItemList, sessionID, true);
    // savehandler_f.saveOpenSessions();
    logger.logInfo(`Item added: ${newItemList.items[0].item_id} count:${newItemList.items[0].count} session:${sessionID}`);
  }
  resetServer(commandStructure) {
    logger.logRequest("Restart Started!");
    server.softRestart();
    logger.logSuccess("Restart Completed");
  }
  displayInfo() {
    for (const command in this.commandsInfo) {
      logger.logRequest(`${command} -> ${this.commandsInfo[command]}`);
    }
  }
  registerAccount(commandStructure) {
    logger.logRequest("Requesting account creation with data:");
    let email = commandStructure[1];
    let edition = "Standard";
    let password = "";
    if (commandStructure.length >= 3) {
      switch (commandStructure[2]) {
        case "1":
          edition = "Prepare To Escape";
          break;
        case "2":
          edition = "Left Behind";
          break;
        case "3":
          edition = "Edge Of Darkness";
          break;
        case "4":
          edition = "Developer";
          break;
      }
    }
    if (commandStructure.length == 4) {
      password = commandStructure[3];
    }
    logger.logRequest(`Login: "${email}", Password: "${password}", Edition: "${edition}"`);
    const info = { email: email, password: password, edition: edition };
  }
}

exports.consoleResponse = new ConsoleResponse();
