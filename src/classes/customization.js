"use strict";

const getPath = (sessionID) => `user/profiles/${sessionID}/storage.json`;
module.exports.getPath = getPath;

module.exports.getCustomization = () => {
	return global._database.customization;
}
module.exports.getAccountCustomization = () => {
	let t = []
	for (let k in customization_f.getCustomization()) {
		let i = customization_f.getCustomization()[k]
		if (!i._props.Side || JSON.stringify(i._props.Side) == "[]") {
			continue;
		} else {
			t.push(i._id)
		}
	}
	return t;
}
module.exports.wearClothing = (pmcData, body, sessionID) => {
	for (let i = 0; i < body.suites.length; i++) {
		let suite = global._database.customization[body.suites[i]];

		// this parent reffers to Lower Node
		if (suite._parent == "5cd944d01388ce000a659df9") {
			pmcData.Customization.Feet = suite._props.Feet;
		}

		// this parent reffers to Upper Node
		if (suite._parent == "5cd944ca1388ce03a44dc2a4") {
			pmcData.Customization.Body = suite._props.Body;
			pmcData.Customization.Hands = suite._props.Hands;
		}
	}

	return item_f.handler.getOutput(sessionID);
}
module.exports.buyClothing = (pmcData, body, sessionID, traderID) => {
	let output = item_f.handler.getOutput(sessionID);
	let storage = fileIO.readParsed(getPath(sessionID));
	let offers = trader_f.handler.getAllCustomization(sessionID);

	// check if outfit already exists
	for (let suiteId of storage.data.suites) {
		if (suiteId === body.offer) {
			return output;
		}
	}

	//transform the body to fit a regular trade so we can use 
	//helper_f.payMoney
	let tBody = {
		Action: 'TradingConfirm',
		type: 'buy_from_trader',
		tid: 'ragfair',
		item_id: utility.generateNewId("T"),
		count: 1,
		scheme_id: 0,
		scheme_items: body.items
	}

	//actually discount our money from the profile
	helper_f.payMoney(pmcData, tBody, sessionID);


	// add outfit to storage (profile)
	for (let offer of offers) {
		if (body.offer === offer._id) {
			storage.data.suites.push(offer.suiteId);
			break;
		}
	}

	fileIO.write(getPath(sessionID), storage);
	return output;
}
