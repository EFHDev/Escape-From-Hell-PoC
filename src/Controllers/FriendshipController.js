const { logger } = require('../../core/util/logger');
const utility = require('../../core/util/utility');
const { AccountController } = require('./AccountController');
const { FriendRequest } = require('./../EFT/JavaScriptTypes/FriendRequest')

/**
 * 
 */
class FriendshipController {

    /**
	 * 
	 * @param {*} sessionID 
	 * @returns {Array}
	 */
	static getFriends(sessionID) {
		// console.log("getFriends");
		let friendAccounts = [];

		let allAccounts = AccountController.getAllAccounts();
		let myAccount = AccountController.find(sessionID);
		if(myAccount === undefined) { 
			logger.logError("Own Account cannot be found!");
			return null;
		}

		if(myAccount.friends === undefined) {
			myAccount.friends = [];
			AccountController.saveToDisk(sessionID);
			return [];
		}
		else {
			for (const id of myAccount.friends) {

				let acc = allAccounts.find(x => x._id == id);
				if(acc) {
					friendAccounts.push(acc);
				}
				else {
					logger.logError(`Unable to find friend's account by its Id (${id}), does it still exist? Removing!`);
					myAccount.friends = myAccount.friends.filter(x=> x !== undefined && x !== null && x._id !== id);
				}
			}
		}

		return friendAccounts;
	}

	/**
	 * 
	 * @param {*} sessionID 
	 * @returns {Array}
	 */
static getFriendRequestInbox(sessionID) {
	var acc = AccountController.find(sessionID);
	if(acc.friendRequestInbox === undefined) {
	  acc.friendRequestInbox = [];
	} 
  
	let resultArray = [];
	/**
	 * friendR is FriendRequest
	 */
	for(const friendR of acc.friendRequestInbox) {
		if(friendR._id !== null) {
			
			const friendRequestInst = new FriendRequest(friendR._id, friendR.from, friendR.to, friendR.date, friendR.profile);
			resultArray.push(friendRequestInst.toFriendRequestResponse(friendR._id));
		}
	}
  
	return resultArray;
}

/**
	 * 
	 * @param {*} sessionID 
	 * @returns {Array}
	 */
static getFriendRequestOutbox(sessionID) {
  var acc = AccountController.find(sessionID);
  if(acc.friendRequestOutbox === undefined) {
	acc.friendRequestOutbox = [];
  } 

  let resultArray = [];
  /**
   * friendR is FriendRequest
   */
  for(const friendR of acc.friendRequestOutbox) {
	  const friendRequestInst = new FriendRequest(friendR._id, friendR.from, friendR.to, friendR.date, friendR.profile);
	  const r = friendRequestInst.toFriendRequestResponse(friendR._id);
	  if(r === undefined)
	  	continue;
		
	resultArray.push(r);
  }

  return resultArray;
}

/**
 * 
 * @param {string} sessionID 
 * @param {string} toID 
 * @returns {object} { requestId, retryAfter, status }
 */
	static addFriendRequest(sessionID, toID) {
		var acc = AccountController.find(sessionID);
		var toAcc = AccountController.find(toID);

		if(acc.friends === undefined) {
		acc.friends = [];
		}

		if(acc.friendRequestOutbox === undefined) {
		acc.friendRequestOutbox = [];
		}

		if(toAcc.friends === undefined) {
		toAcc.friends = [];
		}

		if(toAcc.friendRequestInbox === undefined) {
		toAcc.friendRequestInbox = [];
		}

		const friendRequestId = utility.generateNewId();
		let nFriendRequest = new FriendRequest(friendRequestId, sessionID, toID, new Date().getTime(), sessionID);


		// inbox is a reverse...
		let nFriendRequestInbox = new FriendRequest(friendRequestId, toID, sessionID, new Date().getTime(), sessionID);
		acc.friendRequestOutbox.push(nFriendRequest);
		toAcc.friendRequestInbox.push(nFriendRequestInbox);


		AccountController.saveToDisk(sessionID);
		AccountController.saveToDisk(toID);
		// acc.friends.push(toID);
		// toAcc.friends.push(acc);

		return { requestId: friendRequestId, retryAfter: 30, status: 0 }
	}

	/**
 * 
 * @param {string} sessionID 
 * @param {string} toID 
 * @returns {object} { requestId, retryAfter, status }
 */
	 static deleteFriendRequest(sessionID, requestId) {
		const acc = AccountController.find(sessionID);
		// Outbox
		const frOutbox = FriendshipController.getFriendRequestOutbox(sessionID);
		// Inbox
		const frInbox = FriendshipController.getFriendRequestInbox(sessionID);
FriendshipController.deleteRequestFromBox(frOutbox, requestId);
FriendshipController.deleteRequestFromBox(frInbox, requestId);

		// const frOutboxIndex = frOutbox.indexOf(x=>x._id === requestId);
		// const frInboxIndex = frInbox.indexOf(x=>x._id === requestId);

		// let removedRequest = frOutboxIndex !== -1 || frInboxIndex !== -1;

		// if(frOutboxIndex !== -1) {
		// 	frOutbox.splice(frOutboxIndex, 1);
		// 	logger.logSuccess("Successfully removed friend request " + requestId);
		// }

		// if(frIndex !== -1) {
		// 	frInbox.splice(frIndex, 1);
		// 	logger.logSuccess("Successfully removed friend request " + requestId);
		// }
		
		// if(!removedRequest) {
		// 	logger.logError("Unable to remove friend request " + requestId);
		// }

		// acc.friendRequestOutbox = frOutbox;
		// acc.friendRequestInbox = frInbox;
		AccountController.saveToDisk(sessionID);

		return requestId;
	 }

	 /**
	  * 
	  * @param {Array} box 
	  * @param {string} requestId 
	  */
	 static deleteRequestFromBox(box, requestId) {
		const friendsToKeep = [];
		for(const f of box) {
			if(f._id !== requestId)
				friendsToKeep.push(f);
		}

		box = friendsToKeep;
	 }

	 /**
	  * Adds a friend to the sessionid account
	  * @param {string} sessionID 
	  * @param {string} friend_id 
	  */
	static addFriend(sessionID, friend_id) {
		var acc = AccountController.find(sessionID);
		if(acc.friends === undefined) {
			acc.friends = [];
		}
		acc.friends.push(friend_id);

	}

	static deleteFriend(sessionID, friend_id) {
		var acc = AccountController.find(sessionID);
		if(acc.friends === undefined) {
			acc.friends = [];
		}
		const indexOfFriend = acc.friends.indexOf(friend_id);
		if(indexOfFriend !== -1) {
			acc.friends.splice(indexOfFriend, 1);
		}
	}

	static searchForFriendByNickname() {

	}

	/**
	 * 
	 * @param {string} sessionID 
	 */
	static acceptAllRequests(sessionID) {
		var acc = AccountController.find(sessionID);
		if(acc.friendRequestInbox === undefined) {
			acc.friendRequestInbox = [];
		}

		// add friends to friend list
		for(const frIndex in acc.friendRequestInbox) {
			const fr = acc.friendRequestInbox[frIndex];
			if(fr !== undefined) {
				this.addFriend(sessionID, fr.to);
			}
		}

		// clear the list
		acc.friendRequestInbox = [];

	}
}

module.exports.FriendshipController = FriendshipController;
