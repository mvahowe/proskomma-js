const xre = require('xregexp');

const { UsxLexer } = require("./usx_lexer");

const lexifyUsx = (str) => {
    return new UsxLexer().lex(str);
}

module.exports = { lexifyUsx };
