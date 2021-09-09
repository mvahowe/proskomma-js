const { parseUsfm } = require('./usfm');
const { parseUsx } = require('./usx');
const { parseLexicon } = require('./lexicon');
const { parseTable } = require('./tsv');
const { parseNodes } = require('./nodes');

module.exports = {
  parseUsfm,
  parseUsx,
  parseLexicon,
  parseTable,
  parseNodes,
};
