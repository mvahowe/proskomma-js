import { labelForScope } from 'proskomma-utils';
import { Sequence } from '../../model/sequence';
import { tokenizeString } from '../../lib/tokenize';

let nextNodeId = 0;

const numberNodes = (node, parentId) => {
  if (typeof parentId !== 'number') {
    nextNodeId = 0;
  }

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

  if (node.content) {
    ret[0].content = node.content;
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

  for (const node of flattenNodes(numberNodes(JSON.parse(str)))) {
    treeSequence.newBlock(labelForScope('tTreeNode', [`${node.id}`]));
    const scopePayload = labelForScope('tTreeParent', [`${node.parentId}`]);

    treeSequence.lastBlock().items.push({
      type: 'scope',
      subType: 'start',
      payload: scopePayload,
    });

    if (node.content) {
      for (const [name, content] of Object.entries(node.content)) {
        const treeContentStart = treeSequence.lastBlock().items.length;
        const tokenized = tokenizeString(content);
        const scopePayload = labelForScope('tTreeContent', [name, node.id, `${treeContentStart}`, `${tokenized.length}`]);

        treeSequence.lastBlock().items.push({
          type: 'scope',
          subType: 'start',
          payload: scopePayload,
        });

        for (const [payload, subType] of tokenized) {
          treeSequence.lastBlock().items.push({
            type: 'token',
            subType,
            payload,
          });
        }
        treeSequence.lastBlock().items.push({
          type: 'scope',
          subType: 'end',
          payload: scopePayload,
        });
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
    treeSequence.lastBlock().items.push({
      type: 'scope',
      subType: 'end',
      payload: scopePayload,
    });
  }

  parser.sequences.tree.push(treeSequence);
  parser.sequences.main.addBlockGraft({
    type: 'graft',
    subType: 'tree',
    payload: treeSequence.id,
  });
};

export {
  flattenNodes,
  numberNodes,
  parseNodes,
};
