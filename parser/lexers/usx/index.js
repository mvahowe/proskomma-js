const xre = require('xregexp');

const { UsxLexer } = require("./usx_lexer");

const parseUsx = (str, parser) => {
    new UsxLexer().lexAndParse(str, parser);
}

module.exports = { parseUsx };
