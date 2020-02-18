class Conversation {
    constructor(stranger1, stranger2) {
        this.stranger1 = stranger1;
        this.stranger2 = stranger2;
        this._timeoutId = null;
    }

    init() {
        this.stranger1.initConnection();
        this.stranger2.initConnection();

        Conversation._logInfo('conversation start');

        this._setMessageHandlers();
        this._setConversationEndHandlers();
        this._setReconnectionHandlers();
        this._setConversationStartHandlers();

        process.stdin.resume();
    }

    _setMessageHandlers() {
        this.stranger1.on('message', msg => {
            clearTimeout(this._timeoutId);

            if (this.stranger2.isConversationStarted) {
                return this._talkToStranger2(msg);
            }

            this.stranger2.once('conversationStart', () => this._talkToStranger2(msg));
        });

        this.stranger2.on('message', msg => {
            clearTimeout(this._timeoutId);

            if (this.stranger1.isConversationStarted) {
                return this._talkToStranger1(msg);
            }

            this.stranger1.once('conversationStart', () => this._talkToStranger1(msg));
        });
    }

    _talkToStranger1(msg) {
        console.log('stranger2: ', msg);
        this.stranger1.sendMessage(msg);
    }

    _talkToStranger2(msg) {
        console.log('stranger1: ', msg);
        this.stranger2.sendMessage(msg);
    }

    _setConversationEndHandlers() {
        this.stranger1.on('conversationEnd', isTimeout => {
            if (!isTimeout) {
                Conversation._logInfo('conversation end by stranger 1');
            }

            this.stranger2.endConversation();
        });

        this.stranger2.on('conversationEnd', isTimeout => {
            if (!isTimeout) {
                Conversation._logInfo('conversation end by stranger 2');
            }

            this.stranger1.endConversation();
        });
    }

    _setReconnectionHandlers() {
        this.stranger1.on('reconnection', this._handleReconnection.bind(this));
        this.stranger2.on('reconnection', this._handleReconnection.bind(this));
    }

    _handleReconnection() {
        Conversation._logInfo('conversation start');
        this.stranger1.startConversation();
        this.stranger2.startConversation();
    }

    _setConversationStartHandlers() {
        this.stranger1.on('conversationStart', () => {
            this._setTimeout(() => {
                this.stranger1.endConversation(false);
            });
        });

        this.stranger2.on('conversationStart', () => {
            this._setTimeout(() => {
                this.stranger2.endConversation(false);
            });
        });
    }

    _setTimeout(callback) {
        clearTimeout(this._timeoutId);

        this._timeoutId = setTimeout(() => {
            Conversation._logInfo('timeout');
            callback();
        }, 60 * 1000);
    }

    static _logInfo(msg) {
        const border = '='.repeat(10);
        console.log(`${border} ${msg.toUpperCase()} ${border}`);
    }
}

module.exports = Conversation;
