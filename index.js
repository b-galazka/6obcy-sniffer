const WsClient = require('websocket').client;

const Stranger = require('./Stranger');
const Conversation = require('./Conversation');

const conversation = new Conversation(new Stranger(new WsClient()), new Stranger(new WsClient()));

conversation.init();