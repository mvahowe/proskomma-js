import xre from 'xregexp';

const predicateRegex = '(\\[(([^\\]\']|\'([^\']|\\\\\')*\')+)\\])*';

// Nodes with one of the listed ids
const doAbsoluteIdStep = (docSet, allNodes, nodeLookup, result, queryStep, matches) => {
  const values = matches[1].split(',').map(v => v.trim());
  return { data: Array.from(values).map(nid => allNodes[nodeLookup.get(nid)]) };
};

// The root Node
const doAbsoluteRootStep = (docSet, allNodes) => ({ data: [allNodes[0]] });

// All the nodes
const doAbsoluteNodesStep = (docSet, allNodes) => ({ data: allNodes });

// Children of the nodes
const doChildrenStep = (docSet, allNodes, nodeLookup, result, queryStep, matches) => {
  const childNo = matches[2];
  const childNodeIds = new Set([]);

  for (const parentNode of result.data) {
    const children = docSet.unsuccinctifyScopes(parentNode.is)
      .map(s => s[2].split('/'))
      .filter(s => s[0] === 'tTreeChild')
      .filter(s => !childNo || s[1] === childNo)
      .map(s => s[2]);

    for (const child of children) {
      childNodeIds.add(child);
    }
  }
  return { data: Array.from(childNodeIds).map(nid => allNodes[nodeLookup.get(nid)]) };
};

// The parent of each node
const doParentStep = (docSet, allNodes, nodeLookup, result) => {
  const parentNodeIds = new Set([]);

  for (const childNode of result.data) {
    const parentId = docSet.unsuccinctifyScopes(childNode.is)
      .filter(s => s[2].startsWith('tTreeParent'))
      .map(s => s[2].split('/')[1])[0];
    parentNodeIds.add(parentId);
  }
  return { data: Array.from(parentNodeIds).map(nid => allNodes[nodeLookup.get(nid)]) };
};

// The nth ancestor of each node (where 1 === parent)
const doAncestorStep = (docSet, allNodes, nodeLookup, result, queryStep, matches) => {
  let ancestorNo = parseInt(matches[2]);

  if (ancestorNo < 1) {
    return { errors: `Expected a positive integer argument for ancestor, found ${queryStep}` };
  }

  let nodes = result.data;

  while (ancestorNo > 0) {
    const parentNodeIds = new Set([]);

    for (const childNode of nodes) {
      const parentId = docSet.unsuccinctifyScopes(childNode.is)
        .filter(s => s[2].startsWith('tTreeParent'))
        .map(s => s[2].split('/')[1])[0];
      parentNodeIds.add(parentId);
    }
    nodes = Array.from(parentNodeIds).map(nid => allNodes[nodeLookup.get(nid)]);
    ancestorNo--;
  }
  return { data: nodes };
};

// The nth-generation descendants of each node (where 1 === child)
const doDescendantsStep = (docSet, allNodes, nodeLookup, result, queryStep, matches) => {
  const descendantIds = [];

  const getDescendants = (node, depth) => {
    const childIds = docSet.unsuccinctifyScopes(node.is)
      .filter(s => s[2].startsWith('tTreeChild'))
      .map(s => s[2].split('/')[2]);

    if (depth <= 1 || depth === null) {
      childIds.forEach(n => descendantIds.push(n));
    }

    if (depth === null || depth > 1) {
      childIds.map(nid => allNodes[nodeLookup.get(nid)]).forEach(n => getDescendants(n, depth - 1));
    }
  };

  let descendantGen = null;

  if (matches[3]) {
    descendantGen = parseInt(matches[3]);
  }

  let descendantNo = -1;

  if (matches[5]) {
    descendantNo = parseInt(matches[5]);
  }

  for (const node of result.data) {
    getDescendants(node, descendantGen);
  }
  return {
    data: [...descendantIds.entries()]
      .filter(n => descendantNo < 0 || n[0] === descendantNo)
      .map(n => n[1])
      .map(nid => allNodes[nodeLookup.get(nid)]),
  };
};

// The leaves of each node
const doLeavesStep = (docSet, allNodes, nodeLookup, result) => {
  const leafIds = [];

  const getLeaves = node => {
    const childIds = docSet.unsuccinctifyScopes(node.is)
      .filter(s => s[2].startsWith('tTreeChild'))
      .map(s => s[2].split('/')[2]);

    if (childIds.length === 0) {
      leafIds.push(docSet.unsuccinctifyScopes(node.bs)[0][2].split('/')[1]);
    } else {
      childIds.map(nid => allNodes[nodeLookup.get(nid)]).forEach(n => getLeaves(n));
    }
  };

  for (const node of result.data) {
    getLeaves(node);
  }
  return { data: leafIds.map(nid => allNodes[nodeLookup.get(nid)]) };
};

// The children of the parent of each node
// - get parent of starting node
// - get children of parent node
const doSiblingsStep = (docSet, allNodes, nodeLookup, result) => {
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
  // return { data: allNodes.filter(n => childNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  return { data: Array.from(childNodeIds).map(nid => allNodes[nodeLookup.get(nid)]) };
};

const nodeDetails = (docSet, node, allNodes, nodeLookup, fields, isBranch) => {
  const record = {};

  if (fields.size === 0 || fields.has('id')) {
    record.id = docSet.unsuccinctifyScopes(node.bs)[0][2].split('/')[1];
  }

  if (fields.size === 0 || fields.has('parentId')) {
    record.parentId = docSet.unsuccinctifyScopes(node.is)
      .filter(s => s[2].startsWith('tTreeParent'))
      .map(s => s[2].split('/')[1])[0];
  }

  const content = {};

  for (const [scopeLabels, items] of docSet.sequenceItemsByScopes([node], ['tTreeContent/'], false)) {
    const key = scopeLabels.filter(s => s.startsWith('tTreeContent'))[0].split('/')[1];

    if (fields.size === 0 || fields.has('content') || fields.has(`@${key}`)) {
      content[key] = items.filter(i => i[0] === 'token').map(t => t[2]).join('');
    }
  }

  if (Object.keys(content).length > 0) {
    record.content = content;
  }

  const children = [];

  if (fields.has('children')) {
    for (const childScope of docSet.unsuccinctifyScopes(node.is)
      .filter(s => s[2].startsWith('tTreeChild'))
      .map(s => s[2].split('/')[2])) {
      children.push(childScope);
    }
  }

  if (children.length > 0) {
    if (isBranch) {
      record.children = children
        .map(nid => allNodes[nodeLookup.get(nid)])
        .map(n => nodeDetails(docSet, n, allNodes, nodeLookup, fields, true));
    } else {
      record.children = children;
    }
  }
  return record;
};


// The node details included children
// optional fields are id, parentId, content, @<contentName>, children
const doBranchStep = (docSet, allNodes, nodeLookup, result, queryStep, matches) => {
  const ret = [];
  let fields = new Set([]);

  if (matches[2]) {
    fields = new Set(matches[2].split(',').map(f => f.trim()));
  }

  for (const node of result.data) {
    ret.push(nodeDetails(docSet, node, allNodes, nodeLookup, fields, true));
  }
  return { data: ret };
};

// The node details
// optional fields are id, parentId, content, @<contentName>, children
const doNodeStep = (docSet, allNodes, nodeLookup, result, queryStep, matches) => {
  const ret = [];
  let fields = new Set([]);

  if (matches[2]) {
    fields = new Set(matches[2].split(',').map(f => f.trim()));
  }

  for (const node of result.data) {
    ret.push(nodeDetails(docSet, node, allNodes, nodeLookup, fields, false));
  }
  return { data: ret };
};

const stepActions = [
  {
    regex: xre(`^#\\{([^}]+)\\}${predicateRegex}$`),
    doc: {
      title: 'Nodes by Id',
      syntax: '#(id, id, ...)',
      description: 'Returns nodes whose id is listed',
    },
    predicateCapture: 3,
    inputType: null,
    outputType: 'nodes',
    function: doAbsoluteIdStep,
  },
  {
    regex: xre(`^root${predicateRegex}$`),
    doc: {
      title: 'Root Node',
      syntax: 'root',
      description: 'Returns the root node',
    },
    predicateCapture: 2,
    inputType: null,
    outputType: 'nodes',
    function: doAbsoluteRootStep,
  },
  {
    regex: xre(`^nodes${predicateRegex}$`),
    doc: {
      title: 'Nodes',
      syntax: 'nodes',
      description: 'Returns all the nodes',
    },
    predicateCapture: 2,
    function: doAbsoluteNodesStep,
    inputType: null,
    outputType: 'nodes',
  },
  {
    regex: xre(`^children(\\((\\d+)\\))?${predicateRegex}$`),
    doc: {
      title: 'Children',
      syntax: 'children; children(pos)',
      description: 'Returns the children of the current node(s), optionally filtered by position within the parent node',
    },
    predicateCapture: 5,
    inputType: 'nodes',
    outputType: 'nodes',
    function: doChildrenStep,
  },
  {
    regex: xre(`^descendants((\\((\\d+)(,\\s*(\\d+))?\\))?)${predicateRegex}$`),
    doc: {
      title: 'Descendants',
      syntax: 'descendants; descendants(depth); descendants(depth, pos)',
      description: 'Returns the descendants of the current node(s), optionally at the specified level, optionally filtered by position',
    },
    predicateCapture: 7,
    inputType: 'nodes',
    outputType: 'nodes',
    function: doDescendantsStep,
  },
  {
    regex: xre(`^leaves${predicateRegex}$`),
    doc: {
      title: 'Leaves',
      syntax: 'leaves',
      description: 'Returns the leaves (ie the nodes with no children) below the current node',
    },
    predicateCapture: 2,
    inputType: 'nodes',
    outputType: 'nodes',
    function: doLeavesStep,
  },
  {
    regex: xre(`^parent${predicateRegex}$`),
    doc: {
      title: 'Parent',
      syntax: 'parent',
      description: 'Returns the parent of the current node',
    },
    predicateCapture: 2,
    inputType: 'nodes',
    outputType: 'nodes',
    function: doParentStep,
  },
  {
    regex: xre(`^ancestor(\\((\\d+)\\))${predicateRegex}$`),
    doc: {
      title: 'Ancestor',
      syntax: 'ancestor(depth)',
      description: 'Returns the nth ancestor of the node',
    },
    predicateCapture: 5,
    inputType: 'nodes',
    outputType: 'nodes',
    function: doAncestorStep,
  },
  {
    regex: xre(`^siblings${predicateRegex}$`),
    doc: {
      title: 'Siblings',
      syntax: 'siblings',
      description: 'Returns the children of the parent of the current node',
    },
    predicateCapture: 2,
    inputType: 'nodes',
    outputType: 'nodes',
    function: doSiblingsStep,
  },
  {
    regex: xre(`^node(\\{([^}]+)\\})?${predicateRegex}$`),
    doc: {
      title: 'Node Details',
      syntax: 'node; node{ id, parentId, content, children, @foo }',
      description: 'Returns an object containing the specified content',
    },
    predicateCapture: 4,
    inputType: 'nodes',
    outputType: 'node',
    function: doNodeStep,
  },
  {
    regex: xre(`^branch(\\{([^}]+)\\})?${predicateRegex}$`),
    doc: {
      title: 'Branch',
      syntax: 'branch; branch{ id, parentId, content, children, @foo }',
      description: 'Returns nested objects containing the specified content',
    },
    predicateCapture: 4,
    inputType: 'nodes',
    outputType: 'node',
    function: doBranchStep,
  },
];

module.exports = { stepActions };
