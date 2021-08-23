
var awaitingCaptcha = []
async function sendCaptchaToClient(msg) {
    awaitingCaptcha.push(msg)
}
module.exports = {
    sendCaptchaToClient,
}

const WsClient = require('websocket').client;
const colors = require('colors/safe');
const readline = require('readline');
const fileSystem = require('fs');
const path = require('path');
const express = require("express")
const socketio = require("socket.io")
const http = require("http")

const app = express()   // App of Express
const httpServer = http.createServer(app)
const io = socketio(httpServer)

const { Stranger } = require('./lib/Stranger');
const { Conversation } = require('./lib/Conversation');
const { Logger } = require('./utils/Logger');





const {
    url,
    inactiveConversationTimeout,
    logToFile,
    logsDirectory,
    originUrl
} = require('./config');

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
    stranger1: new Stranger({ wsClient: new WsClient(), url, logger, originUrl }),
    stranger2: new Stranger({ wsClient: new WsClient(), url, logger, originUrl }),
    inactiveConversationTimeout,
    logger,
    consoleIoInterface,
    stdin: process.stdin
});

conversation.init();

app.get("/", (req, res) => {
    res.sendFile(__dirname + path.join("/index.html"))
})


io.on("connection", async socket => {
    socket.emit("captcha", [conversation._stranger1.captcha, 1])
    socket.emit("captcha", [conversation._stranger2.captcha, 2])
    socket.on("captchaResponse", (response) => {
        if (response[1] == 1) {
            conversation._stranger1.sendCaptchaResponse(response[0])
            conversation._stranger1.startConversation()
        } else {
            conversation._stranger2.sendCaptchaResponse(response[0])
            conversation._stranger2.startConversation()
        }
    })
})

httpServer.listen(8080, () => {
    console.log("Server running on port 8080...")
})


