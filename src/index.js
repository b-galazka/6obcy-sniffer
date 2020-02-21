const WsClient = require('websocket').client;
const colors = require('colors/safe');
const readline = require('readline');
const fileSystem = require('fs');
const path = require('path');

const { Stranger } = require('./lib/Stranger');
const { Conversation } = require('./lib/Conversation');
const { Logger } = require('./utils/Logger');
const { url, inactiveConversationTimeout, logToFile, logsDirectory } = require('./config');

colors.setTheme({
    info: 'brightBlue',
    error: 'brightBlue',
    stranger1: 'green',
    stranger2: 'red'
});

const consoleIoInterface = readline.createInterface({ input: process.stdin });

const logger = new Logger(
    colors,
    logToFile,
    path.resolve(__dirname, logsDirectory),
    fileSystem
).init();

const conversation = new Conversation({
    stranger1: new Stranger(new WsClient(), url, logger),
    stranger2: new Stranger(new WsClient(), url, logger),
    inactiveConversationTimeout,
    logger,
    consoleIoInterface,
    stdin: process.stdin
});

conversation.init();
