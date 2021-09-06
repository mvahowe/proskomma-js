const { parseUsfm } = require('./usfm');
const { parseUsx } = require('./usx');
const { parseLexicon } = require('./lexicon');
const { parseTable } = require('./tsv');

module.exports = {
  parseUsfm,
  parseUsx,
  parseLexicon,
  parseTable,
};
