const strangerEvents = require('../consts/strangerEvents');

class Conversation {
    constructor(stranger1, stranger2, inactiveConversationTimeout, logger) {
        this._stranger1 = stranger1;
        this._stranger2 = stranger2;
        this._inactiveConversationTimeout = inactiveConversationTimeout;
        this._logger = logger;
        this._conversationTimeoutId = null;
    }

    init() {
        this._setMessageHandlers();
        this._setConversationStartHandlers();
        this._setConversationEndByMeHandlers();
        this._setConversationEndByAnotherStrangerHandlers();
        this._setConversationTimeoutHandlers();

        this._stranger1.initConnection();
        this._stranger2.initConnection();

        this._logger.info('conversation searching');

        process.stdin.resume();
    }

    _setMessageHandlers() {
        this._stranger1.on(strangerEvents.message, msg => {
            clearTimeout(this._conversationTimeoutId);

            if (this._stranger2.isConversationStarted) {
                return this._talkToStranger2(msg);
            }

            this._stranger2.once(strangerEvents.conversationStart, () =>
                this._talkToStranger2(msg)
            );
        });

        this._stranger2.on(strangerEvents.message, msg => {
            clearTimeout(this._conversationTimeoutId);

            if (this._stranger1.isConversationStarted) {
                return this._talkToStranger1(msg);
            }

            this._stranger1.once(strangerEvents.conversationStart, () =>
                this._talkToStranger1(msg)
            );
        });
    }

    _talkToStranger1(msg) {
        this._logger.stranger1(msg);
        this._stranger1.sendMessage(msg);
    }

    _talkToStranger2(msg) {
        this._logger.stranger2(msg);
        this._stranger2.sendMessage(msg);
    }

    _setConversationEndByMeHandlers() {
        this._stranger1.on(strangerEvents.conversationEndByMe, () =>
            this._handleConversationEndByMe()
        );

        this._stranger2.on(strangerEvents.conversationEndByMe, () =>
            this._handleConversationEndByMe()
        );
    }

    _handleConversationEndByMe() {
        this._logger.info('conversation searching');
        this._stranger1.startConversation();
        this._stranger2.startConversation();
    }

    _setConversationTimeoutHandlers() {
        this._stranger1.on(strangerEvents.conversationTimeout, () =>
            this._stranger2.endConversation()
        );

        this._stranger2.on(strangerEvents.conversationTimeout, () =>
            this._stranger1.endConversation()
        );
    }

    _setConversationEndByAnotherStrangerHandlers() {
        this._stranger1.on(strangerEvents.conversationEndByAnotherStranger, () => {
            this._logger.info('conversation ended by stranger 1');
            this._stranger2.endConversation();
        });

        this._stranger2.on(strangerEvents.conversationEndByAnotherStranger, () => {
            this._logger.info('conversation ended by stranger 2');
            this._stranger1.endConversation();
        });
    }

    _setConversationStartHandlers() {
        this._stranger1.on(strangerEvents.conversationStart, () => {
            if (this._stranger2.isConversationStarted) {
                this._logger.info('conversation started');
            }

            this._setConversationTimeout(this._stranger1);
        });

        this._stranger2.on(strangerEvents.conversationStart, () => {
            if (this._stranger1.isConversationStarted) {
                this._logger.info('conversation start');
            }

            this._setConversationTimeout(this._stranger2);
        });
    }

    _setConversationTimeout(stranger) {
        clearTimeout(this._conversationTimeoutId);

        this._conversationTimeoutId = setTimeout(() => {
            this._logger.info('conversation timeout');
            stranger.endConversation({ isTimeout: true });
        }, this._inactiveConversationTimeout);
    }

    _setRandomQuestionHandlers() {
        this._stranger1.on(strangerEvents.randomQuestion, question => {
            this._logger.info(`stranger1 random question: ${question}`);
        });

        this._stranger2.on(strangerEvents.randomQuestion, question => {
            this._logger.info(`stranger2 random question: ${question}`);
        });
    }
}

module.exports = { Conversation };
