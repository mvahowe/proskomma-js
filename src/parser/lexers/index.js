const { parseUsfm } = require('./usfm');
const { parseUsx } = require('./usx');
const { parseLexicon } = require('./lexicon');
const { parseTableToDocument } = require('./tsv');
const { parseNodes } = require('./nodes');

module.exports = {
  parseUsfm,
  parseUsx,
  parseLexicon,
  parseTableToDocument,
  parseNodes,
};
