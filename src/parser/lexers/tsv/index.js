const { labelForScope } = require('proskomma-utils');
const { Sequence } = require('../../model/sequence');
const { tokenizeString } = require('../../../parser/lib/tokenize');

const parseTableToDocument = (str, parser, bookCode) => {
  const { rows } = JSON.parse(str);
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

module.exports = { parseTableToDocument };
