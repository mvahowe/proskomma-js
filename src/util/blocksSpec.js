const { labelForScope } = require('proskomma-utils');
const { tokenizeString } = require('../parser/lib/tokenize');

const tsvToInputBlock = tsv => {
  const ret = [];
  const rows = tsv.split(/[\n\r]+/);

  for (const [rowN, rowTSV] of rows.entries()) {
    const row = rowTSV.split('\t');

    for (const [cellN, cellString] of row.entries()) {
      const cellRecord = {
        os: [],
        bg: [],
        bs: {
          type: 'scope',
          subType: 'start',
          payload: labelForScope('tTableRow', [`${rowN}`]),
        },
        is: [],
        items: [],
      };
      const colScope = `tTableCol/${cellN}`;

      cellRecord.is.push({
        type: 'scope',
        subType: 'start',
        payload: colScope,
      });
      cellRecord.items.push({
        type: 'scope',
        subType: 'start',
        payload: colScope,
      });

      for (const [token, tokenType] of tokenizeString(cellString)) {
        cellRecord.items.push({
          type: 'token',
          subType: tokenType,
          payload: token,
        });
      }
      cellRecord.items.push({
        type: 'scope',
        subType: 'end',
        payload: colScope,
      });
      ret.push(cellRecord);
    }
  }
  return ret;
};

const escapePayload = str => str.replace('"', '\\"');
const object2Query = obs => '[' + obs.map(ob => `\n    {\n      type: "${ob.type}" \n      subType: "${ob.subType}" \n      payload: "${escapePayload(ob.payload)}"\n    }`).join(',') + ']';
const oneObject2Query = ob => `{\n      type: "${ob.type}" \n      subType: "${ob.subType}" \n      payload: "${escapePayload(ob.payload)}"}`;
const blocksSpec2Query = bSpec => '[\n' + bSpec.map(b => `  {\n    bs: ${oneObject2Query(b.bs)}, \n    bg: ${object2Query(b.bg)}, \n    os: ${object2Query(b.os)}, \n    is: ${object2Query(b.is)}, \n    items: ${object2Query(b.items)}}\n`) + ']';

module.exports = { tsvToInputBlock, blocksSpec2Query, object2Query, oneObject2Query };
