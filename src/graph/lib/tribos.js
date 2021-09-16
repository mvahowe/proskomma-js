import xre from 'xregexp';

class Tribos {
  constructor() {
    this.currentStepType = null;
    const predicateRegex = '(\\[(([^\\]\']|\'([^\']|\\\\\')*\')+)\\])*';

    this.stepActions = [
      {
        regex: xre(`^#\\{([^}]+)\\}${predicateRegex}$`),
        predicateCapture: 3,
        inputType: null,
        outputType: 'nodes',
        function: this.doAbsoluteIdStep,
      },
      {
        regex: xre(`^root${predicateRegex}$`),
        predicateCapture: 2,
        inputType: null,
        outputType: 'nodes',
        function: this.doAbsoluteRootStep,
      },
      {
        regex: xre(`^nodes${predicateRegex}$`),
        predicateCapture: 2,
        function: this.doAbsoluteNodesStep,
        inputType: null,
        outputType: 'nodes',
      },
      {
        regex: xre(`^children(\\((\\d+)\\))?${predicateRegex}$`),
        predicateCapture: 5,
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doChildrenStep,
      },
      {
        regex: xre(`^descendants(\\((\\d+)(,\\s*(\\d+))?\\))${predicateRegex}$`),
        predicateCapture: 6,
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doDescendantsStep,
      },
      {
        regex: xre(`^leaves${predicateRegex}$`),
        predicateCapture: 2,
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doLeavesStep,
      },
      {
        regex: xre(`^parent${predicateRegex}$`),
        predicateCapture: 2,
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doParentStep,
      },
      {
        regex: xre(`^ancestor(\\((\\d+)\\))${predicateRegex}$`),
        predicateCapture: 5,
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doAncestorStep,
      },
      {
        regex: xre(`^siblings${predicateRegex}$`),
        predicateCapture: 2,
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doSiblingsStep,
      },
      {
        regex: xre(`^node(\\{([^}]+)\\})?${predicateRegex}$`),
        predicateCapture: 4,
        inputType: 'nodes',
        outputType: 'node',
        function: this.doNodeStep,
      },
    ];
    this.aggregateFunctions = {
      ids: () => console.log('ids'),
      equals: (a, b) => a === b,
    };
    this.parseFunctions = {
      csArgs: str => str.split(',').map(s => s.trim()),
      quotedString: str => str.substring(1, str.length - 1),
      idRef: () => console.log('idRef'),
      parentIdRef: () => console.log('parentIdRef'),
      contentRef: () => console.log('contentRef'),
      true: () => true,
      false: () => false,
    };
    this.expressions = [
      {
        id: 'booleanExpression',
        oneOf: ['booleanPrimitive', 'equals'],
      },
      {
        id: 'ids',
        regex: xre('^#\\{([^}]+)\\}$'),
        parseFunctions: [null, 'csArgs'],
        argStructure: [['id', [1, null]]],
      },
      {
        id: 'id',
        regex: xre('^".*"$'),
        parseFunctions: ['quotedString'],
      },
      {
        id: 'equals',
        regex: xre('^==\\(([^}]+)\\)$'),
        parseFunctions: [null, 'csArgs'],
        argStructure: [['stringPrimitive', [2, 2]]],
      },
      {
        id: 'stringPrimitive',
        regex: xre('^(id)|(parentId)|(\'([^\']|\\\\\')*\')|(@[a-zA-Z][a-zA-Z0-9_]*)$'),
        parseFunctions: [null, 'idRef', 'parentIdRef', 'quotedString', null, 'contentRef'],
      },
      {
        id: 'booleanPrimitive',
        regex: xre('^(true)|(false)$'),
        parseFunctions: [null, 'true', 'false'],
      },
    ];
  }

  // Nodes with one of the listed ids
  doAbsoluteIdStep(docSet, allNodes, result, queryStep, matches) {
    const values = matches[1].split(',').map(v => v.trim());
    return { data: allNodes.filter(n => values.includes(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  }

  // The root Node
  doAbsoluteRootStep(docSet, allNodes) {
    return { data: [allNodes[0]] };
  }

  // All the nodes
  doAbsoluteNodesStep(docSet, allNodes) {
    return { data: allNodes };
  }

  // Children of the nodes
  doChildrenStep(docSet, allNodes, result, queryStep, matches) {
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
    return { data: allNodes.filter(n => childNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  }

  // The parent of each node
  doParentStep(docSet, allNodes, result) {
    const parentNodeIds = new Set([]);

    for (const childNode of result.data) {
      const parentId = docSet.unsuccinctifyScopes(childNode.is)
        .filter(s => s[2].startsWith('tTreeParent'))
        .map(s => s[2].split('/')[1])[0];
      parentNodeIds.add(parentId);
    }
    return { data: allNodes.filter(n => parentNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  }

  // The nth ancestor of each node (where 1 === parent)
  doAncestorStep(docSet, allNodes, result, queryStep, matches) {
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
      nodes = allNodes.filter(n => parentNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1]));
      ancestorNo--;
    }
    return { data: nodes };
  }

  // The nth-generation descendants of each node (where 1 === child)
  doDescendantsStep(docSet, allNodes, result, queryStep, matches) {
    let descendantGen = parseInt(matches[2]);

    if (descendantGen < 1) {
      return { errors: `Expected a positive integer argument for descendant, found ${queryStep}` };
    }

    let descendantNo = -1;

    if (matches[4]) {
      descendantNo = parseInt(matches[4]);
    }

    let nodes = result.data;

    while (descendantGen > 0) {
      const childNodeIds = new Set([]);

      for (const parentNode of nodes) {
        const childIds = docSet.unsuccinctifyScopes(parentNode.is)
          .filter(s => s[2].startsWith('tTreeChild'))
          .map(s => s[2].split('/')[2]);
        childIds.forEach(c => childNodeIds.add(c));
      }
      nodes = allNodes.filter(n => childNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1]));
      descendantGen--;
    }
    return { data: [...nodes.entries()].filter(n => descendantNo < 0 || n[0] === descendantNo).map(n => n[1]) };
  }

  // The leaves of each node
  doLeavesStep(docSet, allNodes, result, queryStep, matches) {
    const leafIds = new Set([]);
    let nodes = result.data;

    while (nodes.length > 0) {
      const childNodeIds = new Set([]);

      for (const parentNode of nodes) {
        const childIds = docSet.unsuccinctifyScopes(parentNode.is)
          .filter(s => s[2].startsWith('tTreeChild'))
          .map(s => s[2].split('/')[2]);

        if (childIds.length > 0) {
          childIds.forEach(c => childNodeIds.add(c));
        } else {
          leafIds.add(docSet.unsuccinctifyScopes(parentNode.bs)[0][2].split('/')[1]);
        }
      }
      nodes = allNodes.filter(n => childNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1]));
    }
    return { data: allNodes.filter(n => leafIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  }

  // The children of the parent of each node
  // - get parent of starting node
  // - get children of parent node
  doSiblingsStep(docSet, allNodes, result) {
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
  }

  // The node details
  // optional fields are id, parentId, content, @<contentName>
  doNodeStep(docSet, allNodes, result, queryStep, matches) {
    const ret = [];
    let fields = new Set([]);

    if (matches[2]) {
      fields = new Set(matches[2].split(',').map(f => f.trim()));
    }

    for (const node of result.data) {
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
        record.children = children;
      }

      ret.push(record);
    }
    return { data: ret };
  }

  doPredicate(result, predicateString) {
    for (const expression of this.expressions) {
      if (!expression.regex) {
        continue;
      }

      const matches = xre.exec(predicateString, expression.regex);

      if (matches) {
        let found = false;
        for (const [n, parseFunction] of expression.parseFunctions.entries()) {
          if (!parseFunction || !matches[n]) {
            continue;
          }
          found = true;
          const parsed = this.parseFunctions[parseFunction](matches[n]);
          if (expression.argStructure) {
            console.log('aggregator!');
          } else {
            console.log(parsed);
          }
        }
        if (!found) {
          console.log(`Could not parse predicate ${predicateString}`);
        }
      }
    }
    return result;
  }

  doStep(docSet, allNodes, result, queryStep) {
    for (const stepAction of this.stepActions) {
      const matches = xre.exec(queryStep, stepAction.regex);

      if (matches && stepAction.inputType === this.currentStepType) {
        let ret = stepAction.function(docSet, allNodes, result, queryStep, matches);

        if (matches[stepAction.predicateCapture]) {
          ret = this.doPredicate(ret, matches[stepAction.predicateCapture]);
        }
        this.currentStepType = stepAction.outputType;
        return ret;
      }
    }
    return { errors: `Unable to match step ${queryStep}` };
  }

  parse1(docSet, allNodes, result, queryArray) {
    if (queryArray.length > 0) {
      const stepResult = this.doStep(docSet, allNodes, result, queryArray[0]);

      if (stepResult.errors || stepResult.data.length === 0) {
        return stepResult;
      } else {
        return this.parse1(docSet, allNodes, stepResult, queryArray.slice(1));
      }
    } else {
      return result;
    }
  }

  queryArray(qs) {
    const ret = [];

    for (const s of qs.split('/')) {
      ret.push(s);
    }
    return ret;
  }

  parse(docSet, nodes, queryString) {
    // console.log(`\n===> ${queryString}\n`);
    const result = this.parse1(
      docSet,
      nodes,
      { data: nodes },
      this.queryArray(queryString),
    );

    if (result.data) {
      switch (this.currentStepType) {
      case 'nodes':
        result.data = result.data.map(n => ({ id: docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1] }));
      }
    }

    const ret = JSON.stringify(result, null, 2);
    // console.log(`${ret}\n`);
    return ret;
  }
}

module.exports = Tribos;
