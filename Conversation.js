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
        this._setReconnectionHandlers();
    }

    _setMessageHandlers() {
        this.stranger1.on('message', (msg) => {
            if (this.stranger2.isConversationStarted) {
                return this._talkToStranger2(msg);
            }

            this.stranger2.once('conversationStart', () => this._talkToStranger2(msg));
        });

        this.stranger2.on('message', (msg) => {
            if (this.stranger1.isConversationStarted) {
                return this._talkToStranger1(msg);
            }

            this.stranger1.once('conversationStart', () => this._talkToStranger1(msg));
        });
    }

    _talkToStranger1(msg) {
        console.log('stranger1: ', msg);
        this.stranger2.sendMessage(msg);
    }

    _talkToStranger2(msg) {
        console.log('stranger2: ', msg);
        this.stranger1.sendMessage(msg);
    }

    _setConversationEndHandlers() {
        this.stranger1.on('conversationEnd', () => {
            this._logInfo('conversation end by stranger 1');
            this.stranger2.endConversation();
        });

        this.stranger2.on('conversationEnd', () => {
            this._logInfo('conversation end by stranger 2');
            this.stranger1.endConversation();
        });
    }

    _setReconnectionHandlers() {
        this.stranger1.on('reconnection', this._handleReconnection.bind(this));
        this.stranger2.on('reconnection', this._handleReconnection.bind(this));
    }

    _handleReconnection() {
        this._logInfo('conversation start');
        this.stranger1.startConversation();
        this.stranger2.startConversation();
    }

    _logInfo(msg) {
        const border = '='.repeat(10);
        console.log(`${border} ${msg.toUpperCase()} ${border}`);
    }
}

module.exports = Conversation;