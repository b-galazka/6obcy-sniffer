const EventEmitter = require('events');

const { url } = require('./config');

class Stranger extends EventEmitter {
    constructor(wsClient) {
        super();

        this._wsClient = wsClient;
        this._socket = null;
        this._conversationKey = null;
        this._forceClosed = false;
    }

    initConnection() {
        this._wsClient.on('connect', this._handleConnectionSuccess.bind(this));
        this._wsClient.on('connectFailed', this._handleConnectionError.bind(this));
        this._wsClient.connect(url);
    }

    sendMessage(msg) {
        this._socket.sendUTF(`4{"ev_name":"_pmsg","ev_data":{"ckey":"${this._conversationKey}","msg":"${msg}","idn":0},"ceid":7}`);
    }

    startConversation() {
        this._socket.sendUTF('4{"ev_name":"_sas","ev_data":{"channel":"main","myself":{"sex":0,"loc":0},"preferences":{"sex":0,"loc":0}},"ceid":1}');
    }

    endConversation() {
        this._forceClosed = true;
        this._socket.sendUTF(`4{"ev_name":"_distalk","ev_data":{"ckey":"${this._conversationKey}"},"ceid":15}`);
    }

    get isConversationStarted() {
        return !!this._conversationKey;
    }

    _handleConnectionSuccess(socket) {
        this._socket = socket;
        socket.on('message', this._handleSocketMessage.bind(this));
        this.startConversation();
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

            case 'piwo':
                return this._handlePiwoEvent();
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
            this.emit('conversationEnd');
        }

        this._conversationKey = null;
        this._forceClosed = false;
    }

    _handlePiwoEvent() {
        this._socket.sendUTF('4{"ev_name":"_gdzie"}');
    }

    _handleConnectionError(err) {
        console.error(err);
    }
}

module.exports = Stranger;