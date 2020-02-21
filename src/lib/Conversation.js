const strangerEvents = require('../consts/strangerEvents');

class Conversation {
    constructor({
        stranger1,
        stranger2,
        inactiveConversationTimeout,
        logger,
        consoleIoInterface,
        stdin
    }) {
        this._stranger1 = stranger1;
        this._stranger2 = stranger2;
        this._inactiveConversationTimeout = inactiveConversationTimeout;
        this._logger = logger;
        this._consoleIoInterface = consoleIoInterface;
        this._stdin = stdin;
        this._conversationTimeoutId = null;
    }

    get isConversationStarted() {
        return this._stranger1.isConversationStarted && this._stranger2.isConversationStarted;
    }

    init() {
        this._setMessageHandlers();
        this._setConversationStartHandlers();
        this._setConversationEndByMeHandlers();
        this._setConversationEndByAnotherStrangerHandlers();
        this._setConversationTimeoutHandlers();
        this._setUserInputHandler();

        this._stranger1.initConnection();
        this._stranger2.initConnection();

        this._logger.info('conversation searching');

        this._stdin.resume();
    }

    _setMessageHandlers() {
        this._stranger1.on(strangerEvents.message, msg => {
            clearTimeout(this._conversationTimeoutId);

            if (this._stranger2.isConversationStarted) {
                this._talkToStranger2(msg);
                return;
            }

            this._stranger2.once(strangerEvents.conversationStart, () =>
                this._talkToStranger2(msg)
            );
        });

        this._stranger2.on(strangerEvents.message, msg => {
            clearTimeout(this._conversationTimeoutId);

            if (this._stranger1.isConversationStarted) {
                this._talkToStranger1(msg);
                return;
            }

            this._stranger1.once(strangerEvents.conversationStart, () =>
                this._talkToStranger1(msg)
            );
        });
    }

    _talkToStranger1(msg, senderName = 'Stranger2') {
        this._logger.stranger2(msg, senderName);
        this._stranger1.sendMessage(msg);
    }

    _talkToStranger2(msg, senderName = 'Stranger1') {
        this._logger.stranger1(msg, senderName);
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

    _setUserInputHandler() {
        this._consoleIoInterface.on('line', userInput => {
            if (!this.isConversationStarted) {
                this._logger.info('conversation not started yet');
                return;
            }

            const { command, param } = Conversation._parseUserInput(userInput);

            switch (command) {
                case '1':
                    this._talkToStranger2(param, 'You');
                    break;

                case '2':
                    this._talkToStranger1(param, 'You');
                    break;

                default:
                    this._logger.info(`unknown command: ${command}`);
            }
        });
    }

    static _parseUserInput(userInput) {
        const firstColonPos = userInput.indexOf(':');

        return firstColonPos === -1
            ? { command: userInput.trim(), param: null }
            : {
                  command: userInput.slice(0, firstColonPos).trim(),
                  param: userInput.slice(firstColonPos + 1).trim()
              };
    }

    _setProhibitedMessageHandler() {
        this._stranger1.on(strangerEvents.prohibitedMessage, msg =>
            this._handleProhibitedMessage(msg)
        );

        this._stranger2.on(strangerEvents.prohibitedMessage, msg =>
            this._handleProhibitedMessage(msg)
        );
    }

    _handleProhibitedMessage(msg) {
        this._logger.info(`prohibited message: ${msg}`);
    }
}

module.exports = { Conversation };
