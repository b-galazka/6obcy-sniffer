class Conversation {
    constructor(stranger1, stranger2) {
        this.stranger1 = stranger1;
        this.stranger2 = stranger2;
    }

    init() {
        this.stranger1.initConnection();
        this.stranger2.initConnection();

        this._logInfo('conversation start');

        this._setMessageHandlers();
        this._setConversationEndHandlers();
    }

    _setMessageHandlers() {
        this.stranger1.on('message', msg => {
            console.log('stranger1: ', msg);
            this.stranger2.sendMessage(msg);
        });

        this.stranger2.on('message', msg => {
            console.log('stranger2: ', msg);
            this.stranger1.sendMessage(msg);
        });
    }

    _setConversationEndHandlers() {
        this.stranger1.on('conversationEnd', () => {
            this._logInfo('conversation end');
/*             this.stranger2.endConversation();

            this.stranger2.once('conversationEnd', () => {
                this._logInfo('conversation start');
                this.stranger2.startConversation();
            }); */
        });

        this.stranger2.on('conversationEnd', () => {
            this._logInfo('conversation end');
/*             this.stranger1.endConversation();

            this.stranger1.once('conversationEnd', () => {
                this._logInfo('conversation start');
                this.stranger1.startConversation();
            }); */
        });
    }

    _logInfo(msg) {
        const border = '='.repeat(10);
        console.log(`${border} ${msg.toUpperCase()} ${border}`);
    }
}

module.exports = Conversation;