const EventEmitter = require('events');

const { parseJson } = require('../utils/parseJson');
const strangerEvents = require('../consts/strangerEvents');

const indexjs = require("../index.js")

class Stranger extends EventEmitter {
    constructor({ wsClient, url, logger, originUrl }) {
        super();

        this._wsClient = wsClient;
        this._url = url;
        this._originUrl = originUrl;
        this._logger = logger;
        this._isConversationEndedByMe = false;
        this._isConversationEndedByTimeout = false;
        this._ceid = 0;
        this._socket = null;
        this._conversationKey = null;
        this.captcha = "";
    }

    get isConversationStarted() {
        return !!this._conversationKey;
    }

    initConnection() {
        this._wsClient.on('connect', socket => this._handleConnectionSuccess(socket));
        this._wsClient.on('connectFailed', Stranger._handleConnectionError);
        this._wsClient.connect(this._url, undefined, this._originUrl);
    }

    sendMessage(msg) {
        this._emitSocketEvent('_pmsg', {
            ckey: this._conversationKey,
            msg,
            idn: 0
        });
    }

    sendCaptchaResponse(answer) {
        this._emitSocketEvent('_capsol', {
            solution: answer
        })
    }

    startConversation() {
        this._emitSocketEvent('_sas', {
            channel: 'main',
            myself: {
                sex: 0,
                loc: 0
            },
            preferences: {
                sex: 0,
                loc: 0
            }
        });
    }

    // TODO: should take an event to emit as param
    endConversation({ isTimeout = false } = {}) {
        this._isConversationEndedByMe = !isTimeout;
        this._isConversationEndedByTimeout = isTimeout;

        this._emitSocketEvent('_distalk', { ckey: this._conversationKey });
    }

    static _handleConnectionError(err) {
        this._logger.error(err);
    }

    _emitSocketEvent(eventName, eventData) {
        const eventObj = {
            // eslint-disable-next-line camelcase
            ev_name: eventName,
            // eslint-disable-next-line camelcase
            ev_data: eventData,
            ceid: ++this._ceid
        };

        const eventStr = `4${JSON.stringify(eventObj)}`;

        this._socket.sendUTF(eventStr);
    }

    _handleConnectionSuccess(socket) {
        this._socket = socket;

        socket.once('message', msg => this._handleWelcomeMessage(msg));
        socket.on('message', msg => this._handleSocketMessage(msg));
        socket.on('error', Stranger._handleConnectionError);

        this.startConversation();
    }

    _handleWelcomeMessage({ utf8Data }) {
        const { pingInterval } = parseJson(utf8Data);

        setInterval(() => this._socket.sendUTF('2'), pingInterval);
    }

    _handleSocketMessage({ utf8Data }) {
        const msgData = parseJson(utf8Data);
        switch (msgData.ev_name) {
            case 'talk_s':
                this._handleConversationStart(msgData);
                break;

            case 'rmsg':
                this._handleStrangerMessage(msgData);
                break;

            case 'sdis':
                this._handleConversationEnd();
                break;

            case 'rtopic':
                this._handleRandomQuestion(msgData);
                break;

            case 'prohmsg':
                this._handleProhibitedMessage(msgData);
                break;
            case 'caprecvsas':
                console.log(msgData)
                this.captcha = msgData.ev_data.tlce.data
                indexjs.sendCaptchaToClient(this.captcha)
        }
    }

    _handleConversationStart(msgData) {
        this._conversationKey = msgData.ev_data.ckey;

        this.emit(strangerEvents.conversationStart);
    }

    _handleStrangerMessage(msgData) {
        this.emit(strangerEvents.message, msgData.ev_data.msg);
    }

    _handleConversationEnd() {
        if (this._isConversationEndedByMe) {
            this.emit(strangerEvents.conversationEndByMe);
        } else if (this._isConversationEndedByTimeout) {
            this.emit(strangerEvents.conversationTimeout);
        } else {
            this.emit(strangerEvents.conversationEndByAnotherStranger);
        }

        this._conversationKey = null;
        this._isConversationEndedByMe = false;
        this._isConversationEndedByTimeout = false;
    }

    _handleRandomQuestion(msgData) {
        this.emit(strangerEvents.randomQuestion, msgData.ev_data.topic);
    }

    _handleProhibitedMessage(msgData) {
        this.emit(strangerEvents.prohibitedMessage, msgData.ev_data.msg);
    }
}

module.exports = { Stranger };
