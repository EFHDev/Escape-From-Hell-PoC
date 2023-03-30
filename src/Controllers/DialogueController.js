class DialogueController {

    static AddDialogueMessage(dialogueID, messageContent, sessionID, rewards = []) {
    
        dialogue_f.handler.addDialogueMessage(dialogueID, messageContent, sessionID, rewards);
      
    }
}

module.exports.DialogueController = DialogueController;