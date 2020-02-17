const EventEmitter = require('events');

const { url } = require('./config');

class Stranger extends EventEmitter {
    constructor(wsClient) {
        super();

        this._wsClient = wsClient;
        this._socket = null;
        this._conversationKey = null;
        this._forceClosed = false;
        this._isTimeout = false;
        this._ceid = 0;
    }

    initConnection() {
        this._wsClient.on('connect', this._handleConnectionSuccess.bind(this));
        this._wsClient.on('connectFailed', this._handleConnectionError.bind(this));
        this._wsClient.connect(url);
    }

    sendMessage(msg) {
        this._socket.sendUTF(`4{"ev_name":"_pmsg","ev_data":{"ckey":"${this._conversationKey}","msg":"${msg}","idn":0},"ceid":${++this._ceid}}`);
    }

    startConversation() {
        this._socket.sendUTF(
            `4{"ev_name":"_sas","ev_data":{"channel":"main","myself":{"sex":0,"loc":0},"preferences":{"sex":0,"loc":0}},"ceid":${++this._ceid}}`
        );
    }

    endConversation(isTimeout = false) {
        this._forceClosed = !isTimeout;
        this._isTimeout = isTimeout;
        this._socket.sendUTF(`4{"ev_name":"_distalk","ev_data":{"ckey":"${this._conversationKey}"},"ceid":${++this._ceid}}`);
    }

    get isConversationStarted() {
        return !!this._conversationKey;
    }

    _handleConnectionSuccess(socket) {
        this._socket = socket;
        socket.once('message', this._handleWelcomeMessage.bind(this));
        socket.on('message', this._handleSocketMessage.bind(this));
        this.startConversation();

        socket.on('error', console.log);
        socket.on('close', console.log);
    }

    _handleWelcomeMessage({ utf8Data }) {
        const { pingInterval } = Stranger._parseMessageData(utf8Data);
        setInterval(() => this._socket.sendUTF('2'), pingInterval);
    }

    _handleSocketMessage({ utf8Data }) {
        const msgData = Stranger._parseMessageData(utf8Data);

        switch (msgData.ev_name) {
            case 'talk_s':
                return this._handleConversationStart(msgData);

            case 'rmsg':
                return this._handleStrangerMessage(msgData);

            case 'sdis':
                return this._handleConversationEnd();
        }
    }

    static _parseMessageData(data) {
        return JSON.parse(data.slice(data.indexOf('{')));
    }

    _handleConversationStart(msgData) {
        this._conversationKey = msgData.ev_data.ckey;
        this.emit('conversationStart');
    }

    _handleStrangerMessage(msgData) {
        this.emit('message', msgData.ev_data.msg);
    }

    _handleConversationEnd() {
        if (this._forceClosed) {
            this.emit('reconnection');
        } else {
            this.emit('conversationEnd', this._isTimeout);
        }

        this._conversationKey = null;
        this._forceClosed = false;
        this._isTimeout = false;
    }

    _handleConnectionError(err) {
        console.error(err);
    }
}

module.exports = Stranger;