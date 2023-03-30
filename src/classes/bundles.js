"use strict";
const fs = require('fs');
const path = require('path');
const { logger } = require('../../core/util/logger');
const { ConfigController } = require('../Controllers/ConfigController');
const { ResponseController } = require('../Controllers/ResponseController');

/**
 * Explores recursively a directory and returns all the filepaths and folderpaths in the callback.
 * 
 * @see http://stackoverflow.com/a/5827895/4241030
 * @param {String} dir 
 * @param {Function} done 
 */
 function filewalker(dir, done) {
  let results = [];

  const list = fs.readdirSync(dir);

  var pending = list.length;

  if (!pending) return done(null, results);

  list.forEach(function(file) {
      file = path.resolve(dir, file);

      const stat = fs.statSync(file);
      // If directory, execute a recursive call
      if (stat && stat.isDirectory()) {
          // Add directory to array [comment if you need to remove the directories from the array]
          results.push(file);

          filewalker(file, function(err, res){
              results = results.concat(res);
              if (!--pending) done(null, results);
          });
      } else {
          results.push(file);

          if (!--pending) done(null, results);
      }
  });
};

class BundlesServer {
  constructor() {
    this.bundles = [];
    this.bundleBykey = {};
    // this.backendUrl = `https://${serverConfig.ip}:${serverConfig.port}`;
    this.backendUrl = ResponseController.getBackendUrl();
  }



  initialize() {
    if (res.bundles.folders !== undefined && Object.keys(res.bundles.folders).length > 0) {
      for (var f of Object.keys(res.bundles.folders)) {
        var path = res.bundles.folders[f];
        if (!fileIO.exist(path)) continue;
        var files = fileIO
          .readDir(path, true)
          .filter((x) => x.endsWith(".bundle"))
          .map((x) => internal.path.resolve(path, x));
        for (var file in files) {
          this.loadBundle(files[file]);
        }
      }
    }
    if (res.bundles.files !== undefined && Object.keys(res.bundles.files).length > 0) {
      for (var f of Object.keys(res.bundles.files)) {
        var path = res.bundles.files[f];
        if (!fileIO.exist(path)) continue;
        if (path.endsWith(".bundle")) this.loadBundle(path);
      }
    }

   const rootBundlePath = process.cwd() + "/bundles/";
   if(fs.existsSync(rootBundlePath)) {
    filewalker(rootBundlePath, (error, data) => {
      if(data === undefined) 
        return;
      data.forEach(element => {
        if (element.endsWith(".bundle")) 
          this.loadBundle(element);
      });
    });
  }

  if(ConfigController.Configs["server"].alwaysLoadModBundles === true) {
   const modsPath = process.cwd() + "/user/mods/";
   filewalker(modsPath, (error, data) => {
    if(data === undefined) 
      return;
    data.forEach(element => {
      if (element.endsWith("bundles.json")) {
        const modpath = element.replace("bundles.json","");
        //this.loadBundle(element);
        const manifest = JSON.parse(fs.readFileSync(element)).manifest;

        for (const bundle of manifest)
        {
            const bundleHttpPath = `${this.backendUrl}/files/bundle/${bundle.key}`
            const bundleFilepath = bundle.path || `${modpath}bundles/${bundle.key}`.replace(/\\/g, "/")
            // this.bundles[bundle.key] = {
              const newBundle = {
                modPath: modpath,
                key: bundle.key,
                path: bundleHttpPath,
                filepath: bundleFilepath,
                filePath: bundleFilepath,
                dependencyKeys: bundle.dependencyKeys || [],
              };
              this.bundles.push( newBundle)
            this.bundleBykey[bundle.key] = newBundle;
            // logger.logInfo("Load bundle manifest " + bundle.key + " " + bundleHttpPath);
        }
      }

      if (element.endsWith(".manifest")) {
        // console.log(element);
        this.loadBundle(element.replace(".manifest",""));
      }
    });
    
   });
  }


    // console.log(this.bundles);
    // console.log(this.bundleBykey);
  }

  loadBundle(itemPath) {
    var fullItemPath = internal.path.resolve(itemPath);
    var uniformPath = fullItemPath.replace(/\\/g, "/");
    var key = undefined;

    if (uniformPath.toLowerCase().includes("/user/mods/")) key = uniformPath.split(/\/user\/mods\//i)[1];
    else if (uniformPath.toLowerCase().includes("/res/bundles/")) key = uniformPath.split(/\/res\/bundles\//i)[1];
    else if (uniformPath.toLowerCase().includes("/bundles/")) key = uniformPath.split(/\/bundles\//i)[1];

    if (this.bundleBykey !== undefined && this.bundleBykey[key] !== undefined) return;
    var manifestFile = itemPath + ".manifest";
    var dependencyKeys = [];
    if (fs.existsSync(manifestFile)) {
      var content = fileIO.read(manifestFile).toString();
      var dependencyKeys = content
        .replace(/\r/g, "")
        .split("\n")
        .filter((x) => x !== null && x.match(/^ *$/) === null);
    }
    manifestFile = itemPath + ".jmanifest";
    if (fs.existsSync(manifestFile)) {
      const dataJManifest = fs.readFileSync(manifestFile);
      dependencyKeys = JSON.parse(dataJManifest);
    }
    var bundle = {
      key: key,
      path: this.getHttpPath(key),
      filePath: uniformPath,
      dependencyKeys: dependencyKeys,
    };
    // logger.logInfo(`Load bundle manifest: ${bundle.key}`);
    this.bundles.push(bundle);
    this.bundleBykey[bundle.key] = bundle;

    // console.log(this.bundles);
    // console.log(this.bundleBykey);
  }

  getBundles(local) {
    if(this.bundles.length === 0)
      this.initialize();

    let bundles = utility.DeepCopy(this.bundles);
    // console.log(bundles);
    // for (const bundle of bundles) {
    for (const bundle in bundles) {
      // if (local) {
      //   bundle.path = bundle.filePath;
      // }
      delete bundle.filePath;
    }
    return bundles;
  }

  getBundleByKey(key, local) {
    // console.log(key);
    // console.log(local);
    let bundle = utility.DeepCopy(this.bundleBykey[key]);
    if(bundle) {
      // if (local) {
      //   bundle.path = bundle.filePath;
      // }
      // delete bundle.filePath;
      return bundle;
    }
    return undefined;
  }

  getHttpPath(key) {
    return `${this.backendUrl}/files/bundle/${encodeURI(key)}`;
  }
}
module.exports.handler = new BundlesServer();
