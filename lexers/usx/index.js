const xre = require('xregexp');

const { UsxParser } = require("./usx_parser");
const ptClasses = require('../preTokenClasses');

const lexifyUsx = (str) => {
    const saxParser = new UsxParser();
    saxParser.init();
    return saxParser.parse(str);
}

module.exports = { lexifyUsx };
