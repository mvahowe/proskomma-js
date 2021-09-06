import xre from 'xregexp';
const { labelForScope } = require('proskomma-utils');
const { Sequence } = require('../../model/sequence');
const { mainRegex, lexingRegexes } = require('../lexingRegexes');

const tokenTypes = {};

for (const lr of lexingRegexes) {
  if (['eol', 'lineSpace', 'punctuation', 'wordLike'].includes(lr[1])) {
    tokenTypes[lr[1]] = lr[2];
  }
}

const parseTable = (str, parser) => {
  const tokenizeString = str => {
    const ret = [];

    for (const token of xre.match(str, mainRegex, 'all')) {
      let tokenType;

      if (xre.test(token, tokenTypes['wordLike'])) {
        tokenType = 'wordLike';
      } else if (xre.test(token, tokenTypes['punctuation'])) {
        tokenType = 'punctuation';
      } else if (xre.test(token, tokenTypes['lineSpace'])) {
        tokenType = 'lineSpace';
      } else if (xre.test(token, tokenTypes['eol'])) {
        tokenType = 'eol';
      } else {
        tokenType = 'unknown';
      }
      ret.push([token, tokenType]);
    }
    return ret;
  };

  const { rows } = JSON.parse(str);
  const bookCode = 'T01';
  parser.headers.id = bookCode;
  parser.headers.bookCode = bookCode;
  const tableSequence = new Sequence('table');

  for (const [rowN, row] of rows.entries()) {
    for (const [cellN, cell] of row.entries()) {
      tableSequence.newBlock(labelForScope('tTableRow', [`${rowN}`]));
      const lastBlock = tableSequence.lastBlock();

      lastBlock.addItem({
        type: 'scope',
        subType: 'start',
        payload: `tTableCol/${cellN}`,
      });

      for (const [token, tokenType] of tokenizeString(cell)) {
        lastBlock.addItem({
          type: 'token',
          subType: tokenType,
          payload: token,
        });
      }
      lastBlock.addItem({
        type: 'scope',
        subType: 'end',
        payload: `tTableCol/${cellN}`,
      });
    }
  }
  parser.sequences.table.push(tableSequence);
  parser.sequences.main.addBlockGraft({
    type: 'graft',
    subType: 'table',
    payload: tableSequence.id,
  });
};

module.exports = { parseTable };
