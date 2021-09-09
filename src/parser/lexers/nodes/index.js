const { labelForScope } = require('proskomma-utils');
const { Sequence } = require('../../model/sequence');
const { tokenizeString } = require('../../../parser/lib/tokenize');

let nextNodeId = 0;

const numberNodes = (node, parentId) => {
  const ret = {
    ...node,
    id: nextNodeId,
    parentId: typeof parentId === 'number' ? parentId : 'none',
  };
  nextNodeId++;

  if (node.children) {
    ret.children = node.children.map(cn => numberNodes(cn, ret.id));
  }
  return ret;
};

const flattenNodes = node => {
  const ret = [{}];
  ret[0].id = node.id;
  ret[0].parentId = node.parentId;

  if (node.primary) {
    ret[0].primary = node.primary;
  }

  if (node.secondary) {
    ret[0].secondary = node.secondary;
  }

  if (node.children) {
    ret[0].children = [];

    for (const cn of node.children) {
      ret[0].children.push(cn.id);
      flattenNodes(cn).forEach(n => ret.push(n));
    }
  }
  return ret;
};

const parseNodes = (str, parser, bookCode) => {
  parser.headers.id = bookCode;
  parser.headers.bookCode = bookCode;
  const treeSequence = new Sequence('tree');
  const treeContentSequence = new Sequence('treeContent');

  treeSequence.addBlockGraft({
    type: 'graft',
    subType: 'treeContent',
    payload: treeContentSequence.id,
  });

  for (const node of flattenNodes(numberNodes(JSON.parse(str)))) {
    treeSequence.newBlock(labelForScope('tTreeNode', [`${node.id}`]));
    const scopePayload = labelForScope('tTreeParent', [`${node.parentId}`]);
    treeSequence.lastBlock().items.push({
      type: 'scope',
      subType: 'start',
      payload: scopePayload,
    });
    treeSequence.lastBlock().items.push({
      type: 'scope',
      subType: 'end',
      payload: scopePayload,
    });

    if (node.primary || node.secondary) {
      treeContentSequence.newBlock(labelForScope('tTreeNode', [`${node.id}`]));

      if (node.primary) {
        const treeContentStart = treeContentSequence.lastBlock().items.length;
        const tokenized = tokenizeString(node.primary);
        const scopePayload = labelForScope('tTreeContent', ['-', node.id, `${treeContentStart}`, `${tokenized.length}`]);

        treeSequence.lastBlock().items.push({
          type: 'scope',
          subType: 'start',
          payload: scopePayload,
        });
        treeSequence.lastBlock().items.push({
          type: 'scope',
          subType: 'end',
          payload: scopePayload,
        });

        for (const [payload, subType] of tokenized) {
          treeContentSequence.lastBlock().items.push({
            type: 'token',
            subType,
            payload,
          });
        }
      }
      if (node.secondary) {
        for (const [name, content] of Object.entries(node.secondary)) {
          const treeContentStart = treeContentSequence.lastBlock().items.length;
          const tokenized = tokenizeString(content);
          const scopePayload = labelForScope('tTreeContent', [name, node.id, `${treeContentStart}`, `${tokenized.length}`]);

          treeSequence.lastBlock().items.push({
            type: 'scope',
            subType: 'start',
            payload: scopePayload,
          });
          treeSequence.lastBlock().items.push({
            type: 'scope',
            subType: 'end',
            payload: scopePayload,
          });

          for (const [payload, subType] of tokenized) {
            treeContentSequence.lastBlock().items.push({
              type: 'token',
              subType,
              payload,
            });
          }
        }
      }
      if (node.children) {
        for (const [childN, childNodeN] of node.children.entries()) {
          const scopePayload = labelForScope('tTreeChild', [childN, childNodeN]);
          treeSequence.lastBlock().items.push({
            type: 'scope',
            subType: 'start',
            payload: scopePayload,
          });
          treeSequence.lastBlock().items.push({
            type: 'scope',
            subType: 'end',
            payload: scopePayload,
          });
        }
      }
    }
  }

  parser.sequences.tree.push(treeSequence);
  parser.sequences.treeContent.push(treeContentSequence);
  parser.sequences.main.addBlockGraft({
    type: 'graft',
    subType: 'tree',
    payload: treeSequence.id,
  });
};

module.exports = { parseNodes };
