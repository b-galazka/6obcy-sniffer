const WsClient = require('websocket').client;
const colors = require('colors/safe');

const { Stranger } = require('./lib/Stranger');
const { Conversation } = require('./lib/Conversation');
const { Logger } = require('./utils/Logger');
const { url, inactiveConversationTimeout } = require('./config');

colors.setTheme({
    info: 'brightBlue',
    error: 'brightBlue',
    stranger1: 'green',
    stranger2: 'red'
});

const logger = new Logger(colors);

const conversation = new Conversation(
    new Stranger(new WsClient(), url, logger),
    new Stranger(new WsClient(), url, logger),
    inactiveConversationTimeout,
    logger
);

conversation.init();

// TODO: add "/skip", "1: msg", and "2: msg" commands and prohibited messages
// TODO: allow to log to files
