class Logger {
    constructor(colors) {
        this._colors = colors;
    }

    info(text) {
        const formattedText = this._colors.info(text.toUpperCase());
        console.log(formattedText);
    }

    error(text) {
        const formattedText = this._colors.error(text);

        console.log('\n<Error>');
        console.log(formattedText);
        console.log('</Error>\n');
    }

    stranger1(text) {
        const formattedText = this._colors.stranger1(`${this._colors.bold('Stranger1')}: ${text}`);

        console.log(formattedText);
    }

    stranger2(text) {
        const formattedText = this._colors.stranger2(`${this._colors.bold('Stranger2')}: ${text}`);

        console.log(formattedText);
    }
}

module.exports = { Logger };
