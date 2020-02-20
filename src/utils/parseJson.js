function parseJson(str) {
    return JSON.parse(str.slice(str.indexOf('{')));
}

module.exports = { parseJson };
