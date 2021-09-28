const { labelForScope } = require('proskomma-utils');
const { tokenizeString } = require('../parser/lib/tokenize');
const { flattenNodes, numberNodes } = require('../parser/lexers/nodes');

const tsvToInputBlock = (tsv, hasHeadings) => {
  const ret = [];
  const rows = tsv.split(/[\n\r]+/);

  for (const [rowN, rowTSV] of rows.entries()) {
    if (hasHeadings && rowN === 0) {
      continue;
    }

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

const treeToInputBlock = treeJson => {
  const ret = [];

  for (const node of flattenNodes(numberNodes(treeJson))) {
    const nodeRecord = {
      os: [],
      bg: [],
      bs: {
        type: 'scope',
        subType: 'start',
        payload: labelForScope('tTreeNode', [`${node.id}`]),
      },
      is: [],
      items: [],
    };
    const scopePayload = labelForScope('tTreeParent', [`${node.parentId}`]);

    nodeRecord.items.push({
      type: 'scope',
      subType: 'start',
      payload: scopePayload,
    });

    nodeRecord.is.push({
      type: 'scope',
      subType: 'start',
      payload: scopePayload,
    });

    if (node.content) {
      for (const [name, content] of Object.entries(node.content)) {
        const treeContentStart = nodeRecord.items.length;
        const tokenized = tokenizeString(content);
        const scopePayload = labelForScope('tTreeContent', [name, node.id, `${treeContentStart}`, `${tokenized.length}`]);

        nodeRecord.items.push({
          type: 'scope',
          subType: 'start',
          payload: scopePayload,
        });

        nodeRecord.is.push({
          type: 'scope',
          subType: 'start',
          payload: scopePayload,
        });

        for (const [payload, subType] of tokenized) {
          nodeRecord.items.push({
            type: 'token',
            subType,
            payload,
          });
        }
        nodeRecord.items.push({
          type: 'scope',
          subType: 'end',
          payload: scopePayload,
        });
      }
    }

    if (node.children) {
      for (const [childN, childNodeN] of node.children.entries()) {
        const scopePayload = labelForScope('tTreeChild', [childN, childNodeN]);

        nodeRecord.items.push({
          type: 'scope',
          subType: 'start',
          payload: scopePayload,
        });
        nodeRecord.is.push({
          type: 'scope',
          subType: 'start',
          payload: scopePayload,
        });
        nodeRecord.items.push({
          type: 'scope',
          subType: 'end',
          payload: scopePayload,
        });
      }
    }
    nodeRecord.items.push({
      type: 'scope',
      subType: 'end',
      payload: scopePayload,
    });
    ret.push(nodeRecord);
  }
  return ret;
};

const escapePayload = str => str.replace('"', '\\"');
const object2Query = obs => '[' + obs.map(ob => `\n    {\n      type: "${ob.type}" \n      subType: "${ob.subType}" \n      payload: "${escapePayload(ob.payload)}"\n    }`).join(',') + ']';
const oneObject2Query = ob => `{\n      type: "${ob.type}" \n      subType: "${ob.subType}" \n      payload: "${escapePayload(ob.payload)}"}`;
const blocksSpec2Query = bSpec => '[\n' + bSpec.map(b => `  {\n    bs: ${oneObject2Query(b.bs)}, \n    bg: ${object2Query(b.bg)}, \n    os: ${object2Query(b.os)}, \n    is: ${object2Query(b.is)}, \n    items: ${object2Query(b.items)}}\n`) + ']';

module.exports = {
  tsvToInputBlock, treeToInputBlock, blocksSpec2Query, object2Query, oneObject2Query,
};
