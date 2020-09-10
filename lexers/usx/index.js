const sax = require("sax");
const xre = require('xregexp');

const ptClasses = require('../preTokenClasses');

const lexifyUsx = (str) => {
    const saxParser = sax.parser(true);
    saxParser.ontext = function(t) {
        console.log(t);
    }
    saxParser.write(str).close();
    return [];
}

module.exports = { lexifyUsx };