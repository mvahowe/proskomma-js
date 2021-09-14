import xre from 'xregexp';

// Nodes with one of the listed ids
const doAbsoluteIdStep = (docSet, allNodes, result, queryStep, matches) => {
  const values = matches[1].split(',').map(v => v.trim());
  return { data: allNodes.filter(n => values.includes(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
};

// The root Node
const doAbsoluteRootStep = (docSet, allNodes) => ({ data: [allNodes[0]] });

// All the nodes
const doAbsoluteNodesStep = (docSet, allNodes) => ({ data: allNodes });

// Children of the nodes
const doChildrenStep = (docSet, allNodes, result) => {
  const childNodeIds = new Set([]);

  for (const parentNode of result.data) {
    const children = docSet.unsuccinctifyScopes(parentNode.is)
      .filter(s => s[2].startsWith('tTreeChild'))
      .map(s => s[2].split('/')[2]);

    for (const child of children) {
      childNodeIds.add(child);
    }
  }
  return { data: allNodes.filter(n => childNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
};

// The parent of each node
const doParentStep = (docSet, allNodes, result) => {
  const parentNodeIds = new Set([]);

  for (const childNode of result.data) {
    const parentId = docSet.unsuccinctifyScopes(childNode.is)
      .filter(s => s[2].startsWith('tTreeParent'))
      .map(s => s[2].split('/')[1])[0];
    parentNodeIds.add(parentId);
  }
  return { data: allNodes.filter(n => parentNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
};

// The children of the parent of each node
// - get parent of starting node
// - get children of parent node
const doSiblingsStep = (docSet, allNodes, result) => {
  const parentNodeIds = new Set([]);

  for (const childNode of result.data) {
    const parentId = docSet.unsuccinctifyScopes(childNode.is)
      .filter(s => s[2].startsWith('tTreeParent'))
      .map(s => s[2].split('/')[1])[0];
    parentNodeIds.add(parentId);
  }

  const parentNodes = allNodes.filter(n => parentNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1]));
  const childNodeIds = new Set([]);

  for (const parentNode of parentNodes) {
    const children = docSet.unsuccinctifyScopes(parentNode.is)
      .filter(s => s[2].startsWith('tTreeChild'))
      .map(s => s[2].split('/')[2]);

    for (const child of children) {
      childNodeIds.add(child);
    }
  }
  return { data: allNodes.filter(n => childNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
};

// The node details
const doNodeStep = (docSet, allNodes, result) => {
  const ret = [];

  for (const node of result.data) {
    const record = {};

    record.id = docSet.unsuccinctifyScopes(node.bs)[0][2].split('/')[1];

    record.parentId = docSet.unsuccinctifyScopes(node.is)
      .filter(s => s[2].startsWith('tTreeParent'))
      .map(s => s[2].split('/')[1])[0];

    const content = {};

    for (const [scopeLabels, items] of docSet.sequenceItemsByScopes([node], ['tTreeContent/'], false)) {
      const key = scopeLabels.filter(s => s.startsWith('tTreeContent'))[0].split('/')[1];
      content[key] = items.filter(i => i[0] === 'token').map(t => t[2]).join('');
    }

    if (Object.keys(content).length > 0) {
      record.content = content;
    }
    ret.push(record);
  }
  return ret;
};

const stepActions = [
  [
    xre('^#\\{([^}]+)\\}$'),
    doAbsoluteIdStep,
    new Set(['absolute']),
  ],
  [
    xre('^root$'),
    doAbsoluteRootStep,
    new Set(['absolute']),
  ],
  [
    xre('^nodes$'),
    doAbsoluteNodesStep,
    new Set(['absolute']),
  ],
  [
    xre('^children$'),
    doChildrenStep,
    new Set([]),
  ],
  [
    xre('^parent$'),
    doParentStep,
    new Set([]),
  ],
  [
    xre('^siblings$'),
    doSiblingsStep,
    new Set([]),
  ],
  [
    xre('^node$'),
    doNodeStep,
    new Set(['last']),
  ],
];

const doStep = (docSet, allNodes, result, queryStep, isAbsolute) => {
  for (const stepAction of stepActions) {
    const matches = xre.exec(queryStep, stepAction[0]);

    if (matches) {
      if (isAbsolute && !stepAction[2].has('absolute')) {
        return { errors: `Expected absolute step, found ${queryStep}` };
      }

      if (!isAbsolute && stepAction[2].has('absolute')) {
        return { errors: `Expected relative step, found ${queryStep}` };
      }
      return stepAction[1](docSet, allNodes, result, queryStep, matches);
    }
  }
  return { errors: `Unable to match step ${queryStep}` };
};

const tribos1 = (docSet, allNodes, result, queryArray, isAbsolute) => {
  if (queryArray.length > 0) {
    const stepResult = doStep(docSet, allNodes, result, queryArray[0], isAbsolute);

    if (result.errors || result.data.length === 0) {
      return result;
    } else {
      return tribos1(docSet, allNodes, stepResult, queryArray.slice(1));
    }
  } else {
    return result;
  }
};

const queryArray = qs => {
  const ret = [];

  for (const s of qs.split('/')) {
    ret.push(s);
  }
  return ret;
};

const tribos = (docSet, nodes, queryString) => {
  const result = tribos1(
    docSet,
    nodes,
    { data: nodes },
    queryArray(queryString),
    true,
  );

  if (result.data) {
    result.data = result.data.map(n => docSet.unsuccinctifyBlock(n, {}));
  }
  return (JSON.stringify(result, null, 2));
};

module.exports = tribos;
