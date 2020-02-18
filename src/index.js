const WsClient = require('websocket').client;

const Stranger = require('./lib/Stranger');
const Conversation = require('./lib/Conversation');

const conversation = new Conversation(new Stranger(new WsClient()), new Stranger(new WsClient()));

conversation.init();

// TODO: add "/skip", "1: msg", and "2: msg" commands
// TODO: handle random questions
// TODO: allow to log to files
// TODO: add colored output
// TODO: refactor
