//const EventEmitter = require('events');
const fs = require('fs');
const { logger } = require('../../core/util/logger');
const util = require('../../core/util/utility');
const { AccountController } = require('./AccountController');
const { ConfigController } = require('./ConfigController');
const { TradingController } = require('./TradingController');
const { RepeatableQuest, RepeatableQuestResponse } = require('./../EFT/JavaScriptTypes/Quests/RepeatableQuest');
//class QuestEvent extends EventEmitter {}

class QuestController {

    static questConfig = ConfigController.Configs["quest"];

    static getQuestsFile() {
        var rawQuestFile = fs.readFileSync(process.cwd() + '/db/quests/quests.json');
        return rawQuestFile;
    }

    static cachedQuests = [];

    static getQuestsFileParsed() {
        if(QuestController.cachedQuests.length === 0)
            QuestController.cachedQuests = JSON.parse(rawQuestFile);

        return QuestController.cachedQuests;
    }

    static createQuest() {

    }

    static createQuestForKilling(trader, faction, map, numberOfKills) {
        var baseQuest = this.getQuestsFileParsed()[0];
        baseQuest._id = util.generateNewId();
    }

    /**
     * Credit: SPT-Aki team, with changes made by Paulov
     * @param {*} _info 
     * @param {*} sessionID 
     * @returns {Array} List of Repeatable Quests
     */
    static getRepeatableQuests = function (_info, sessionID) {
        var returnData = [];

        if(ConfigController.Configs['quest'].enableRepeatableQuests === false)
            return returnData;

        var pmcData = AccountController.getPmcProfile(sessionID);
        const repQuestResp = new RepeatableQuestResponse();
        // for(const trader of TradingController.getAllTraders()) {
            const repQuest = new QuestController.generateRepeatableTemplate("Elimination", TradingController.TraderIdToNameMap["Prapor"]);
            // repQuest.conditions.AvailableForFinish[0]._props.counter.id = util.generateNewId();
            // repQuest.conditions.AvailableForFinish[0]._props.id = util.generateNewId();
            repQuestResp.activeQuests.push(
                repQuest
            );
        // }


        // Add change requirement
        for(const q of repQuestResp.activeQuests) {
            repQuestResp.changeRequirement[q._id] = {
                "changeCost": [
                    {
                        "templateId": "5449016a4bdc2d6f028b456f",
                        "count": 1000
                    }
                ],
                "changeStandingCost": 0
            }
        }
        returnData.push(repQuestResp);
        return returnData;
    };

    /**
     * 
     * @param {*} type 
     * @param {*} traderId 
     * @returns {RepeatableQuest} RepeatableQuest
     */
    static generateRepeatableTemplate = function (type, traderId) {
        let quest = new RepeatableQuest();
        quest._id = util.generateNewId();
        quest.traderId = traderId;
        quest.name = quest.name.replace("{traderId}", traderId);
        quest.note = quest.note.replace("{traderId}", traderId);
        quest.description = quest.description.replace("{traderId}", traderId);
        quest.successMessageText = quest.successMessageText.replace("{traderId}", traderId);
        quest.failMessageText = quest.failMessageText.replace("{traderId}", traderId);
        quest.startedMessageText = quest.startedMessageText.replace("{traderId}", traderId);
        if(!quest.changeQuestMessageText) quest.changeQuestMessageText = "";
        quest.changeQuestMessageText = quest.changeQuestMessageText.replace("{traderId}", traderId);
        return quest;
    };

    static generateEliminationCondition = function (target, bodyPart, distance) {
        var killConditionProps = {
            target: target,
            value: 1,
            id: util.generateNewId(),
            dynamicLocale: true
        };
        if (target.startsWith("boss")) {
            killConditionProps.target = "Savage";
            killConditionProps.savageRole = [target];
        }
        if (bodyPart) {
            killConditionProps.bodyPart = bodyPart;
        }
        if (distance) {
            killConditionProps.distance = {
                compareMethod: ">=",
                value: distance
            };
        }
        return {
            _props: killConditionProps,
            _parent: "Kills"
        };
    };

    static changeRepeatableQuest(pmcData, body, sessionID) {
        let output = item_f.handler.getOutput(sessionID);

        // // for (const cost of changeRequirement.changeCost)
        // // {
        // //     output = this.paymentService.addPaymentToOutput(pmcData, cost.templateId, cost.count, sessionID, output)
        // //     if (output.warnings.length > 0)
        // //     {
        // //         return output
        // //     }
        // // }
        output.profileChanges[sessionID].repeatableQuests = [];
        return output;

    }
}

//module.exports.QuestEvent = new QuestEvent();
module.exports.QuestController = QuestController;

