const xre = require('xregexp');

const { LexiconLexer } = require("./lexicon_lexer");

const parseLexicon = (str, parser) => {
    new LexiconLexer().lexAndParse(str, parser);
}

module.exports = { parseLexicon };
