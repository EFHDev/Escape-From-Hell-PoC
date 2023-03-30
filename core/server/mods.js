"use strict";
const path = require('path');
const { AkiModLoader } = require('../../src/AkiModSupport/AkiModLoader');
const fileIO = require('./../util/fileIO');

function scanRecursiveMod(filepath, baseNode, modNode) {
	if (typeof modNode === "string") {
		baseNode = filepath + modNode;
	}

	if (Array.isArray(modNode))
		return baseNode; // For skipping bundles sections
	if (typeof modNode === "object") {
		for (let node in modNode) {
			if (!(node in baseNode)) {
				baseNode[node] = {};
			}

			baseNode[node] = scanRecursiveMod(filepath, baseNode[node], modNode[node]);
		}
	}

	return baseNode;
}

function isRebuildRequired() {
	if (!fileIO.exist("user/cache/db.json")
		|| !fileIO.exist("user/cache/res.json")) {
		return true;
	}
	return false;
}

function scanRecursiveRoute(filepath, deep = false) { // recursively scans given path
	if (filepath == "db/")
		if (!fileIO.exist("db/"))
			return;
	let baseNode = {};
	let directories = utility.getDirList(filepath);
	const files = fileIO.readDir(filepath);

	// remove all directories from files
	for (let directory of directories) {
		for (let file in files) {
			if (files[file] === directory) {
				files.splice(file, 1);
			}
		}
	}

	// make sure to remove the file extention
	for (let node in files) {
		let fileName = files[node].split('.').slice(0, -1).join('.');
		baseNode[fileName] = filepath + files[node];
	}

	// deep tree search
	for (let node of directories) {
		//if(node != "items" && node != "assort" && node != "customization" && node != "locales" && node != "locations" && node != "templates")
		baseNode[node] = scanRecursiveRoute(filepath + node + "/");
	}

	return baseNode;
}

function routeDatabaseAndResources() { // populate global.db and global.res with folders data
	// logger.logInfo("Rebuilding cache: route database");
	global.db = scanRecursiveRoute("db/");
	// logger.logInfo("Rebuilding cache: route resources");
	global.res = scanRecursiveRoute("res/");
	global.files = scanRecursiveRoute("files/");

	// populate res/bundles
	res.bundles = { files: [], folders: [] };
	// var path = 'res/bundles';
	// var results = fileIO.readDir(path, true);
	// var bundles = results.filter(x => x.toLowerCase().endswith('.bundle'));
	// var bundlePaths = bundles.map(x => internal.path.resolve(path, x));
	// res.bundles.files = res.bundles.files.concat(bundlePaths);

	/* add important server paths */
	db.user = {
		configs: {
			server: "user/configs/server.json",
			gameplay: "user/configs/gameplay.json",
			// cluster: "user/configs/cluster.json",
			// blacklist: "user/configs/blacklist.json",
			mods: "user/configs/mods.json"
		},
		events: {
			schedule: "user/events/schedule.json"
		},
		profiles: {
			character: "user/profiles/__REPLACEME__/character.json",
			dialogue: "user/profiles/__REPLACEME__/dialogue.json",
			storage: "user/profiles/__REPLACEME__/storage.json",
			userbuilds: "user/profiles/__REPLACEME__/userbuilds.json"
		}
	}
	// fileIO.write("user/cache/db.json", db);
	// fileIO.write("user/cache/res.json", res);
}

const SortedModKeys = () => Object.keys(global.mods.toLoad)
	.sort((a, b) => (global.mods.toLoad[a].order > global.mods.toLoad[b].order) ? 1 : -1);

function loadMod(loadType) {
	const sortedList = SortedModKeys();
	for (let element of sortedList) {
		if (!global.mods.toLoad[element].isEnabled) {
			continue;
		}
		const modFolder = global.mods.toLoad[element].folder;
		const mod = fileIO.readParsed(`user/mods/${modFolder}/mod.config.json`);
		// if (loadType == "ResModLoad") {
			if (mod.res !== undefined) {
				res = scanRecursiveMod(`user/mods/${modFolder}/`, res, mod.res);

				// Add items to res.bundles
				if (mod.res && mod.res.bundles && !mod.res.bundles.loaded) {
					if (mod.res.bundles.folders) {
						let fullPaths = mod.res.bundles.folders.map(x => internal.path.resolve(`user/mods/${modFolder}`, x));
						res.bundles.folders = res.bundles.folders.concat(fullPaths);
					}
					if (mod.res.bundles.files) {
						let fullPaths = mod.res.bundles.files.map(x => internal.path.resolve(`user/mods/${modFolder}`, x));
						res.bundles.files = res.bundles.files.contcat(fullPaths);
					}
					mod.res.bundles.loaded = true;
				}
			}
		// } else {
			for (const srcToExecute in mod.src) {
				if (mod.src[srcToExecute] == loadType) {
					logger.logDebug(`Executing Mod: ${modFolder}/${srcToExecute}`);
					// make sure to use correct pathing excludes usage of path and is shorter :)
					require(path.join(process.cwd(), `/user/mods/${modFolder}/${srcToExecute}`)).mod(mod); // execute mod
				}
			}

			
		// }
	}
}

exports.CacheModLoad = () => { // Loading mods flagged as load at creating cache
	loadMod("CacheModLoad");
}

exports.ResModLoad = () => { // loading res files from mods if they exist
	loadMod("ResModLoad");
}

exports.TamperModLoad = () => { // Loading mods flagged as load after "server is ready to start"
	loadMod("TamperModLoad");
}

class ModLoader { // handles loading mods
	constructor() {
		this.modsConfig = {};
		this.modsRequirements = {};
		this.orderNumber = 1;
		this.AlreadyQueriedMods = [];
	}

	loadModFolder() { // Not Found File mods.json - loop through folders and load all mods that are correct
		const modsFolder = fileIO.readDir("user/mods").filter(dir => fileIO.lstatSync("user/mods/" + dir).isDirectory());
		for (const modFolder of modsFolder) {
			if (fileIO.exist(`user/mods/${modFolder}/package.json`)) {// && fileIO.exist(`user/mods/${modFolder}/package.js`)) {
				// logger.logWarning(`Invalid mod: this mod structure is incorrect (its AKI mod). Skipping loading mod: ${modFolder}`);
				AkiModLoader.loadMod(modFolder, `user/mods/${modFolder}/package.json`);
				continue;
			}
			if (!fileIO.exist(`user/mods/${modFolder}/mod.config.json`)) {
				logger.logWarning(`Missing file: mod.config.json. Ignoring mod: ${modFolder}`);
				continue;
			}
			const modConfig = fileIO.readParsed(`user/mods/${modFolder}/mod.config.json`);
			if (modConfig.name === undefined) {
				logger.logWarning(`Missing config key: "name" is missing or its not a string. Skipping loading mod: ${modFolder}`);
				continue;
			}
			if (modConfig.version === undefined) {
				logger.logWarning(`Missing config key: "version" is missing or its not a string. Skipping loading mod: ${modFolder}`);
				continue;
			}
			if (modConfig.required === undefined) {
				logger.logWarning(`Missing config key: "required" is missing or its not a string. Skipping loading mod: ${modFolder}`);
				continue;
			}
			if (modConfig.src === undefined) {
				logger.logWarning(`Missing config key: "src" is missing or its not a string. Skipping loading mod: ${modFolder}`);
				continue;
			}
			if (modConfig.isEnabled !== undefined && !modConfig.isEnabled) {
				logger.logWarning(`Mod Disabled: Ignoring mod: ${modFolder}`);
				continue;
			}
			if (modConfig.isActive !== undefined && !modConfig.isActive) {
				logger.logWarning(`Mod Disabled: Ignoring mod: ${modFolder}`);
				continue;
			}

			const modUniqueID = `${modConfig.name}-${modConfig.version}_${modConfig.author}`;
			this.modsConfig[modUniqueID] = {
				"isEnabled": true,
				"folder": modFolder,
				"order": -1
			};
			this.modsRequirements[modUniqueID] = modConfig.required;
						
		}
		fileIO.write("user/configs/mods.json", this.modsConfig);
	}

	modsFileFound() { // Found File mods.json so loading already saved config and checking for new files also check if mods got removed
		this.modsConfig = fileIO.readParsed(`user/configs/mods.json`);
		for (let modKey in this.modsConfig) {
			const modInfo = this.modsConfig[modKey];
			if (!modInfo.isEnabled) {
				continue;
			}

			// Check if mod exists on disk.
			if (!fileIO.exist(`user/mods/${modInfo.folder}`)) {
				logger.logWarning(`Could not find the mod on disk for ${modKey}. Assuming it was removed...`)
				delete this.modsConfig[modKey]
				return;
			}

			const modConfig = fileIO.readParsed(`user/mods/${modInfo.folder}/mod.config.json`);
			const modUniqueID = `${modConfig.name}-${modConfig.version}_${modConfig.author}`;
			this.modsRequirements[modUniqueID] = modConfig.required;
		}

		const modsFolder = fileIO.readDir("user/mods").filter(dir => fileIO.lstatSync("user/mods/" + dir).isDirectory());

		if (Object.keys(this.modsConfig).length != modsFolder.length) {
			logger.logInfo("Detected new mod folders. Trying to add them to the list...");

			for (const folderName of modsFolder) {
				const configPath = `user/mods/${folderName}/mod.config.json`
				if (!fileIO.exist(configPath)) {
					logger.logError(`No mod config found for ${folderName}. Skipping...`)
					return;
				}
				let modConfig;
				try {
					modConfig = fileIO.readParsed(configPath);
				} catch (e) {
					logger.logError(`There was an error reading the mod config for ${folderName}. Skipping... \nError: ${e.stack}`)
					return;
				}
				const modUniqueID = `${modConfig.name}-${modConfig.version}_${modConfig.author}`;
				if (typeof modConfig[modUniqueID] == "undefined") {
					this.modsConfig[modUniqueID] = {
						"isEnabled": true,
						"folder": folderName,
						"order": -1
					};
				}
			}
		}

		// TODO: still missing if someone deletes mod folder then delete it from list !!!
	}

	queryNoRequirementMods() { // Add to the list mods without requirements aka CORE mods
		for (const key in this.modsRequirements) {
			let modRequired;

			if (typeof this.modsRequirements[key] == "undefined") {
				modRequired = 0 // Mod is missing a 'requirements' array.
			} else {
				modRequired = this.modsRequirements[key].length;
			}

			if (modRequired === 0) {
				const modConfigFile = fileIO.readParsed(`user/mods/${this.modsConfig[key].folder}/mod.config.json`);
				this.modsConfig[key].order = this.orderNumber;
				this.orderNumber++;
				this.AlreadyQueriedMods.push({ "name": modConfigFile.name, "ver": modConfigFile.version });
				delete this.modsRequirements[key];
			}
		}
	}

	queryRequirementMods() { // Add to the list mods with requirements
		let maxLength = 0;
		for (const modData in this.modsRequirements) {
			if (maxLength < this.modsRequirements[modData].length)
				maxLength = this.modsRequirements[modData].length;
		}
		for (let i = 1; i <= maxLength; i++) {
			for (const key in this.modsRequirements) {
				if (this.modsRequirements[key].length === i) {
					const maxSize = this.modsRequirements[key].length;
					for (let inc = 0; inc < maxSize; inc++) {
						const foundMods = this.AlreadyQueriedMods.find(mod => {
							if (mod.name === this.modsRequirements[key][inc].name) {
								return mod;
							}
						});
						if (typeof foundMods == "undefined") {
							logger.logWarning(`Mod: ${this.modsConfig[key].folder} failed to load due to a missing dependency.`);
							delete this.modsRequirements[key];
							delete this.modsConfig[key];
							continue;
						}

						let versionComparison = "equal";
						let versionOfReqMod = this.modsRequirements[key][inc].ver;

						if (versionOfReqMod.charAt(0) == "^") {
							versionComparison = "newEqual";
							versionOfReqMod = versionOfReqMod.substring(1);
						}
						switch (versionComparison) {
							case "equal":
								if (foundMods.ver != versionOfReqMod) {
									logger.logWarning(`Mod: ${this.modsConfig[key].folder} failed to load due to an uncompatible dependency version.`);
									logger.logWarning(`Mod version is ${foundMods.ver} which is not the required version of ${versionOfReqMod}.`);
									delete this.modsRequirements[key];
									delete this.modsConfig[key];
									continue;
								}
								break;
							case "newEqual":
								if (foundMods.ver != versionOfReqMod) {
									const requiredVersion = versionOfReqMod.split('.');
									const foundVersion = foundMods.ver.split('.');
									if (
										requiredVersion[0] < foundVersion[0] ||
										requiredVersion[1] < foundVersion[1] ||
										requiredVersion[2] < foundVersion[2]) {
										logger.logWarning(`Mod: ${this.modsConfig[key].folder} failed to load due to an uncompatible dependency version.`);
										logger.logWarning(`Mod version is ${foundMods.ver} which is not the required version of ${versionOfReqMod} or newer.`);
										delete this.modsRequirements[key];
										delete this.modsConfig[key];
										continue;
									}
								}
								break;
						}
					}
					// all is good we can add the mod
					this.modsConfig[key].order = this.orderNumber;
					this.orderNumber++;
					this.AlreadyQueriedMods.push({ "name": this.modsConfig[key].name });
					delete this.modsRequirements[key];
					continue;
				}
			}
		}
	}

	sortModsByOrder() { // sorting mods by their assigned order key
		const tempModsConfig = this.modsConfig;
		const tempTable = Object.keys(this.modsConfig).sort((a, b) => (tempModsConfig[a].order > tempModsConfig[b].order) ? 1 : -1);
		// ASC: >	// DESC: <

		let newTable = [];
		for (const key of tempTable) {
			newTable.push(this.modsConfig[key]);
		}
		this.modsConfig = newTable;
		return newTable;
	}

	loadModsData() { // Loading Mods - Core function
		// Loading mods (without execute)
		// let emptyModsConfig = false;
		// if (!fileIO.exist("user/configs/mods.json") || serverConfig.rebuildCache) {
		// 	fileIO.write("user/configs/mods.json", {});
		// 	emptyModsConfig = true;
		// }
		// -- need to be mored to functions later on !!!

		this.loadModFolder();
		// if (emptyModsConfig) {
		// 	this.modsFileNotFound();
		// } else {
		// 	this.modsFileFound();
		// }
		// save full config in: globals mods config
		global.mods.config = this.modsConfig;


		// first loop with no requirements
		this.queryNoRequirementMods();

		// lets check requirements of first mod requirements

		this.queryRequirementMods();

		// save mods list to load
		//return sorted to loading order list
		global.mods.toLoad = this.modsConfig;//this.sortModsByOrder();
		fileIO.write("user/configs/mods.json", global.mods.toLoad)
	}
}

exports.load = () => {
	// if somehow any of rebuildCache will be triggered do not check other things it will be recached anyway
	// create mods folder if missing
	if (!fileIO.exist("user/mods/")) {
		fileIO.mkDir("user/mods/");
	}
	// if (!fileIO.exist("./user/cache") || fileIO.readDir("./user/cache").length < 28) { // health number of cache file count is 28 as for now ;)
	// 	logger.logWarning("Missing files! [<28] Rebuilding cache required!");
		serverConfig.rebuildCache = true;
	// }
	let modLoader = new ModLoader();
	// Loading mods data and set them in order
	modLoader.loadModsData();
	// logger.logDebug("isRebuildRequired = " + isRebuildRequired());
	// // check if db need rebuid
	// if (isRebuildRequired() && !serverConfig.rebuildCache) {
	// 	logger.logWarning("Missing db.json or res.json file.");
	// 	serverConfig.rebuildCache = true;
	// }

	// rebuild db
	// if (serverConfig.rebuildCache) {
	// 	// logger.logWarning("Rebuilding cache...");
		routeDatabaseAndResources();
	// } else {
	// 	db = fileIO.readParsed("user/cache/db.json");
	// 	res = fileIO.readParsed("user/cache/res.json");
	// }
}