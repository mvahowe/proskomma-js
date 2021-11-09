const { parseUsfm } = require('./usfm');
const { parseUsx } = require('./usx');
const { parseTableToDocument } = require('./tsv');
const { parseNodes } = require('./nodes');

module.exports = {
  parseUsfm,
  parseUsx,
  parseTableToDocument,
  parseNodes,
};
