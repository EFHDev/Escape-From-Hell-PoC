const { TarkovSend } = require("../../core/server/tarkovSend");
const { logger } = require("../../core/util/logger");
const fs = require('fs');


class Callbacks {
	cosntructor() {
	}
	getReceiveCallbacks() {
		return {
			"insurance": this.receiveInsurance,
			"SAVE": this.receiveSave
		};
	}
	getRespondCallbacks() {
		return {
			"BUNDLE": this.respondBundle,
			"IMAGE": this.respondImage,
			"NOTIFY": this.respondNotify,
			"DONE": this.respondKillResponse
		};
	}
	receiveInsurance(sessionID, req, resp, body, output) {
		if (req.url === "/client/notifier/channel/create") {
			// insurance_f.handler.checkExpiredInsurance();
		}
	}
	receiveSave(sessionID, req, resp, body, output) {
		// if (global._database.clusterConfig.saveOnReceive) {
		// 	savehandler_f.saveOpenSessions();
		// }
	}

	respondBundle(sessionID, req, resp, body) {
		let bundleKey = req.url.split('/bundle/')[1];
		bundleKey = decodeURI(bundleKey);
		// logger.logInfo(`[BUNDLE]: ${req.url}`);
		let bundle = bundles_f.handler.getBundleByKey(bundleKey, true);
		let path = bundle.filePath;
		// send bundle
		// server.tarkovSend.file(resp, path);
		TarkovSend.sendFile(resp, path);

	}
	respondImage(sessionID, req, resp, body) {
		let splittedUrl = req.url.split('/');
		let fileName = splittedUrl[splittedUrl.length - 1].split('.').slice(0, -1).join('.');
		let baseNode = {};
		let imgCategory = "none";

		

		

		// get images to look through
		switch (true) {
			case req.url.includes("/quest"):
				logger.logInfo(`[IMG.quests]: ${req.url}`);
				baseNode = res.quest;
				imgCategory = "quest";
				break;

			case req.url.includes("/handbook"):
				logger.logInfo(`[IMG.handbook]: ${req.url}`);
				baseNode = res.handbook;
				imgCategory = "handbook";
				break;

			case req.url.includes("/avatar"):
				logger.logInfo(`[IMG.avatar]: ${req.url}`);
				baseNode = res.trader;
				imgCategory = "avatar";
				break;

			case req.url.includes("/banners"):
				logger.logInfo(`[IMG.banners]: ${req.url}`);
				baseNode = res.banners;
				imgCategory = "banner";
				break;

			default:
				logger.logInfo(`[IMG.hideout]: ${req.url}`);
				baseNode = res.hideout;
				imgCategory = "hideout";
				break;
		}

		// console.log(baseNode);
		// console.log(baseNode[fileName]);
		// if(req.url.indexOf("/files") !== -1 && !fs.existsSync(process.cwd() + req.url)) {
		// 	// req.url = 

		// }
		// console.log(req.url);
		// console.log(fileName);

		// if file does not exist
		if (!baseNode[fileName]) {
			logger.logError("Image not found! Sending backup image.");
			baseNode[fileName] = "res/noimage/" + imgCategory + ".png";
			TarkovSend.sendFile(resp, baseNode[fileName]);
			// server.tarkovSend.file(resp, baseNode[fileName]);
		} else {
			// send image
			TarkovSend.sendFile(resp, baseNode[fileName]);
			// server.tarkovSend.file(resp, baseNode[fileName]);
		}
	}
	respondNotify(sessionID, req, resp, data) {
		console.log(respondNotify);
		let splittedUrl = req.url.split('/');
		sessionID = splittedUrl[splittedUrl.length - 1].split("?last_id")[0];
		notifier_f.handler.notificationWaitAsync(resp, sessionID);
	}
	respondKillResponse() {
		return;
	}
}
exports.callbacks = new Callbacks();