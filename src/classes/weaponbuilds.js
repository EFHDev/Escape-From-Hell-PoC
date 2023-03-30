"use strict";

function getPath(sessionID) {
  return `user/profiles/${sessionID}/userbuilds.json`;
}

function getUserBuilds(sessionID) {
  let userBuildsMap = fileIO.readParsed(getPath(sessionID));

  let userBuilds = [];

  for (let buildName in userBuildsMap) {
    userBuilds.push(userBuildsMap[buildName]);
  }

  return userBuilds;
}

function SaveBuild(pmcData, body, sessionID) {
  delete body.Action;
  body.id = utility.generateNewItemId();

  let savedBuilds = fileIO.readParsed(getPath(sessionID));

  // replace duplicate ID's. The first item is the base item.
  // The root ID and the base item ID need to match.
  body.items = helper_f.replaceIDs(pmcData, body.items, false);
  body.root = body.items[0]._id;

  let output = item_f.handler.getOutput(sessionID);
  output.profileChanges[pmcData._id].builds.push(body);
  item_f.handler.setOutput(output);

  savedBuilds[body.name] = body;
  fileIO.write(getPath(sessionID), savedBuilds);

  return output;
}

function RemoveBuild(pmcData, body, sessionID) {
  let savedBuilds = fileIO.readParsed(getPath(sessionID));

  for (let name in savedBuilds) {
    if (savedBuilds[name].id === body.id) {
      delete savedBuilds[name];
      fileIO.write(getPath(sessionID), savedBuilds);
      break;
    }
  }

  return item_f.handler.getOutput(sessionID);
}

module.exports.getPath = getPath;
module.exports.getUserBuilds = getUserBuilds;
module.exports.saveBuild = SaveBuild;
module.exports.removeBuild = RemoveBuild;
