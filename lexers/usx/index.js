const xre = require('xregexp');

const { UsxParser } = require("./usx_parser");
const ptClasses = require('../preTokenClasses');

const lexifyUsx = (str) => {
    return new UsxParser().parse(str);
}

module.exports = { lexifyUsx };
