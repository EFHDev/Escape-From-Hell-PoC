const utility = require('../../../core/util/utility');
const { AccountController } = require('./../../Controllers/AccountController');


/**
 * 
 */
class FriendRequest {
    /**
     * 
     * @param {*} id 
     * @param {*} from 
     * @param {*} to 
     * @param {*} date 
     * @param {*} profile 
     */
    constructor(id, from, to, date, profile) {

        this._id = utility.generateNewId();
        if(id)
            this._id = id;
        /** 
         * AccountId
         */
        this.from = "";
        if(from)
            this.from = from;
        /** 
         * AccountId
         */
        this.to = "";
        if(to)
            this.to = to;

        this.date = new Date().getTime();
        if(date) {
            this.date = date;
        }
        /** 
         * AccountId
         */
        this.profile = "";
        if(profile)
            this.profile = profile;
    }

    /**
     * 
     * @param {number} friendRequestId 
     * @returns {object}
     */
    toFriendRequestResponse(friendRequestId) {
        if(!friendRequestId)
            friendRequestId = utility.generateNewId();
        
        if(this.to === undefined)
            return undefined;

        if(this.from === undefined)
            return undefined;

        var acc = AccountController.find(this.from);
		var toAcc = AccountController.find(this.to);

		// console.log("from");
		// console.log(acc);
		// console.log("to");
		// console.log(toAcc);

        let pmcProfile = AccountController.getPmcProfile(this.to);

        if(pmcProfile === undefined) 
            return undefined;

        let profile = {
            _id: pmcProfile._id,
            Info: {
                Nickname: pmcProfile.Info.Nickname,
                Side: pmcProfile.Info.Side,
                Level: pmcProfile.Info.Level,
                MemberCategory: pmcProfile.Info.MemberCategory,
            }


        }

        return new FriendRequestResponse(friendRequestId, this.from, this.to, new Date().getTime(), profile);
    }

}

class FriendRequestResponse {
    /**
     * 
     * @param {*} id 
     * @param {*} from 
     * @param {*} to 
     * @param {*} date 
     * @param {*} profile 
     */
    constructor(id, from, to, date, profile) {

        this._id = utility.generateNewId();
        if(id)
            this._id = id;
        /** 
         * UpdatableChatMember
         */
        this.from = {};
        if(from)
            this.from = from;
        /** 
         * UpdatableChatMember
         */
        this.to = {};
        if(to)
            this.to = to;

        this.date = new Date().getTime();
        if(date) {
            this.date = date;
        }
        /** 
         * UpdatableChatMember
         */
        this.profile = {};
        if(profile)
            this.profile = profile;
    }

    /**
     * 
     * @param {FriendRequest} friendRequest 
     * @returns {object}
     */
    static fromFriendRequest(friendRequest) {
      


        return friendRequest.toFriendRequestResponse();
    }
}

module.exports.FriendRequest = FriendRequest;
module.exports.FriendRequestResponse = FriendRequestResponse;