const path = require('path');

class Logger {
    constructor(colors, shouldLogToFile, logsDirectory, fileSystem) {
        this._colors = colors;
        this._shouldLogToFile = shouldLogToFile;
        this._logsDirectory = logsDirectory;
        this._fileSystem = fileSystem;
        this._logsFilePath = null;
    }

    init() {
        if (this._shouldLogToFile) {
            this._fileSystem.mkdirSync(this._logsDirectory, { recursive: true });
            this._logsFilePath = path.resolve(this._logsDirectory, Logger._getLogsFileName());
        }

        return this;
    }

    static _getLogsFileName() {
        const currentDate = new Date();
        const timezoneOffsetInMs = currentDate.getTimezoneOffset() * 60 * 1000;
        const isoDate = new Date(currentDate.getTime() - timezoneOffsetInMs).toISOString();

        const date = isoDate
            .slice(0, isoDate.indexOf('T'))
            .split('-')
            .join('_');

        const time = isoDate
            .slice(isoDate.indexOf('T') + 1, isoDate.indexOf('.'))
            .split(':')
            .join('_');

        return `${date}_${time}.log`;
    }

    info(text) {
        const formattedText = this._colors.info(text.toUpperCase());
        this._log(text.toUpperCase(), formattedText);
    }

    error(text) {
        const formattedText = this._colors.error(text);
        this._log(`\n<Error>\n${text}\n</Error>\n`, `\n<Error>\n${formattedText}\n</Error>\n`);
    }

    stranger1(text, strangerName) {
        const formattedText = this._colors.stranger1(`${this._colors.bold(strangerName)}: ${text}`);
        this._log(`${strangerName} (1): ${text}`, formattedText);
    }

    stranger2(text, strangerName) {
        const formattedText = this._colors.stranger2(`${this._colors.bold(strangerName)}: ${text}`);
        this._log(`${strangerName} (2): ${text}`, formattedText);
    }

    _log(text, formattedText = text) {
        const currentDate = new Date();

        if (this._shouldLogToFile) {
            const fileLog = `${currentDate.toLocaleString()} | ${text}\n`;
            this._fileSystem.appendFile(this._logsFilePath, fileLog, () => {});
        }

        console.log(`| ${currentDate.toLocaleTimeString()} | ${formattedText}`);
    }
}

module.exports = { Logger };
