import xre from 'xregexp';

const aggregateFunctions = {
  equals: (docSet, node, a, b) => a === b,
  notEqual: (docSet, node, a, b) => a !== b,
  and: (docSet, node, ...args) => args.filter(a => !a).length === 0,
  or: (docSet, node, ...args) => args.filter(a => a).length > 0,
  not: (docSet, node, a) => !a,
  idRef: (docSet, node) => docSet.unsuccinctifyScopes(node.bs)[0][2].split('/')[1],
  parentIdRef: (docSet, node) => docSet.unsuccinctifyScopes(node.is).filter(s => s[2].startsWith('tTreeParent'))[0][2].split('/')[1],
  nChildren: (docSet, node) => docSet.unsuccinctifyScopes(node.is).filter(s => s[2].startsWith('tTreeChild')).length,
  contentRef: (docSet, node, label) => {
    const labelIG = docSet.sequenceItemsByScopes([node], ['tTreeContent/'], false)
      .filter(ig => {
        const key = ig[0].filter(s => s.startsWith('tTreeContent'))[0].split('/')[1];
        return key === label;
      });
    return labelIG ?
      labelIG[0][1].filter(i => i[0] === 'token').map(t => t[2]).join('') :
      null;
  },
  hasContent: (docSet, node, label) => {
    const labelIG = docSet.sequenceItemsByScopes([node], ['tTreeContent/'], false)
      .filter(ig => {
        const key = ig[0].filter(s => s.startsWith('tTreeContent'))[0].split('/')[1];
        return key === label;
      });
    return labelIG.length > 0;
  },
  concat: (docSet, node, ...args) => args.join(''),
  startsWith: (docSet, node, a, b) => a.startsWith(b),
  endsWith: (docSet, node, a, b) => a.endsWith(b),
  contains: (docSet, node, a, b) => a.includes(b),
  matches: (docSet, node, a, b) => xre.test(a, xre(b)),
  int: (docSet, node, str) => parseInt(str),
  string: (docSet, node, int) => `${int}`,
  left: (docSet, node, str, int) => str.substring(0, int),
  right: (docSet, node, str, int) => str.substring(str.length - int),
  length: (docSet, node, str) => str.length,
  indexOf: (docSet, node, a, b) => a.indexOf(b),
  add: (docSet, node, ...args) => args.reduce((x, y) => x + y),
  mul: (docSet, node, ...args) => args.reduce((x, y) => x * y),
  sub: (docSet, node, a, b) => a - b,
  div: (docSet, node, a, b) => Math.floor(a / b),
  mod: (docSet, node, a, b) => a % b,
  gt: (docSet, node, a, b) => a > b,
  lt: (docSet, node, a, b) => a < b,
  ge: (docSet, node, a, b) => a >= b,
  le: (docSet, node, a, b) => a <= b,
};

const parseFunctions = {
  quotedString: str => str.substring(1, str.length - 1),
  int: str => parseInt(str),
  true: () => true,
  false: () => false,
};

const splitArgs = str => {
  const ret = [[]];
  let pos = 0;
  let nParen = 0;
  let inQuote = false;

  while (str && pos < str.length) {
    switch (str[pos]) {
    case '\\':
      ret[ret.length - 1].push(str[pos]);

      if (str[pos + 1] ==='\'') {
        ret[ret.length - 1].push(str[pos + 1]);
        pos++;
      }
      break;
    case '\'':
      ret[ret.length - 1].push(str[pos]);
      inQuote = !inQuote;
      break;
    case '(':
      if (inQuote) {
        ret[ret.length - 1].push(str[pos]);
      } else {
        ret[ret.length - 1].push(str[pos]);
        nParen++;
      }
      break;
    case ')':
      if (inQuote) {
        ret[ret.length - 1].push(str[pos]);
      } else {
        ret[ret.length - 1].push(str[pos]);
        nParen--;
      }
      break;
    case ',':
      if (!inQuote && nParen === 0) {
        ret.push([]);

        while (str[pos + 1] === ' ') {
          pos++;
        }
      } else {
        ret[ret.length - 1].push(str[pos]);
      }
      break;
    default:
      ret[ret.length - 1].push(str[pos]);
    }
    pos++;
  }
  return ret.map(e => e.join(''));
};

const expressions = {
  expression: { oneOf: ['stringExpression', 'intExpression', 'booleanExpression'] },
  booleanExpression: { oneOf: ['booleanPrimitive', 'equals', 'notEqual', 'and', 'or', 'not', 'contains', 'startsWith', 'endsWith', 'matches', 'gt', 'lt', 'ge', 'le', 'hasContent'] },
  stringExpression: { oneOf: ['concat', 'left', 'right', 'string', 'idRef', 'parentIdRef', 'contentRef', 'stringPrimitive'] },
  intExpression: { oneOf: ['length', 'indexOf', 'int', 'nChildren', 'intPrimitive', 'add', 'sub', 'mul', 'div', 'mod'] },
  equals: {
    regex: xre('^==\\((.+)\\)$'),
    argStructure: [['expression', [2, 2]]],
  },
  notEqual: {
    regex: xre('^!=\\((.+)\\)$'),
    argStructure: [['expression', [2, 2]]],
  },
  and: {
    regex: xre('^and\\((.+)\\)$'),
    argStructure: [['booleanExpression', [2, null]]],
  },
  or: {
    regex: xre('^or\\((.+)\\)$'),
    argStructure: [['booleanExpression', [2, null]]],
  },
  concat: {
    regex: xre('^concat\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, null]]],
  },
  contentRef: {
    regex: xre('^content\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]]],
  },
  hasContent: {
    regex: xre('^hasContent\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]]],
  },
  contains: {
    regex: xre('^contains\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  startsWith: {
    regex: xre('^startsWith\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  endsWith: {
    regex: xre('^endsWith\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  matches: {
    regex: xre('^matches\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  left: {
    regex: xre('^left\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]], ['intExpression', [1, 1]]],
  },
  right: {
    regex: xre('^right\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]], ['intExpression', [1, 1]]],
  },
  length: {
    regex: xre('^length\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]]],
  },
  indexOf: {
    regex: xre('^indexOf\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  not: {
    regex: xre('^not\\((.+)\\)$'),
    argStructure: [['booleanExpression', [1, 1]]],
  },
  int: {
    regex: xre('^int\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]]],
  },
  string: {
    regex: xre('^string\\((.+)\\)$'),
    argStructure: [['intExpression', [1, 1]]],
  },
  idRef: {
    regex: xre('^id$'),
    argStructure: [],
  },
  parentIdRef: {
    regex:
    xre('^parentId$'),
    argStructure: [],
  },
  nChildren: {
    regex:  xre('^nChildren$'),
    argStructure: [],
  },
  add: {
    regex: xre('^add\\((.+)\\)$'),
    argStructure: [['intExpression', [2, null]]],
  },
  mul: {
    regex: xre('^mul\\((.+)\\)$'),
    argStructure: [['intExpression', [2, null]]],
  },
  sub: {
    regex: xre('^sub\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  div: {
    regex: xre('^div\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  mod: {
    regex: xre('^mod\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  gt: {
    regex: xre('^>\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  lt: {
    regex: xre('^<\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  ge: {
    regex: xre('^>=\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  le: {
    regex: xre('^<=\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  stringPrimitive: {
    regex: xre('^(\'([^\']|\\\\\')*\')$'),
    parseFunctions: [null, 'quotedString'],
  },
  intPrimitive: {
    regex: xre('^(-?[0-9]+)$'),
    parseFunctions: [null, 'int'],
  },
  booleanPrimitive: {
    regex: xre('^(true)|(false)$'),
    parseFunctions: [null, 'true', 'false'],
  },
};

const parseRegexExpression = (docSet, node, predicateString, expressionId, matches) => {
  // console.log(`parseRegexExpression ${predicateString} ${expressionId} ${matches}`);
  const expressionRecord = expressions[expressionId];

  if (!expressionRecord) {
    throw new Error(`Unknown expression ${expressionId} for predicate ${predicateString}`);
  }

  let found = false;

  if (expressionRecord.parseFunctions) {
    for (const [n, parseFunction] of expressionRecord.parseFunctions.entries()) {
      if (!parseFunction || !matches[n]) {
        continue;
      }
      found = true;
      return { data: parseFunctions[parseFunction](matches[n]) };
    }

    if (!found) {
      return { errors: `Could not parse predicate ${predicateString}` };
    }
  } else {
    const argRecords = splitArgs(matches[1]);
    const argStructure = expressionRecord.argStructure;
    const argResults = [];

    if (argStructure.length > 0) {
      let argRecordN = 0;
      let argStructureN = 0;
      let nOccs = 0;

      while (argRecordN < argRecords.length) {
        const argRecord = argRecords[argRecordN];
        const argResult = parseExpression(docSet, node, argRecord, argStructure[argStructureN][0]);
        argResults.push(argResult);
        argRecordN++;
        nOccs++;

        if (argStructure[argStructureN][1][1] && nOccs >= argStructure[argStructureN][1][1]) {
          argStructureN++;
          nOccs = 0;
        }
      }
    }

    if (argResults.filter(ar => ar.errors).length === 0) {
      // console.log(expressionId);
      const args = argResults.map(ar => ar.data);
      const aggregated = aggregateFunctions[expressionId](docSet, node, ...args);
      // console.log('aggregated', expressionId, argRecords, aggregated);
      return { data:  aggregated };
    }
    return { errors: `Could not parse arguments to ${expressionId}: ${argRecords.filter(ar => ar.errors).map(ar => ar.errors).join('; ')}` };
  }
};

const parseExpression = (docSet, node, predicate, expressionId) => {
  // console.log(`parseExpression ${predicate}, ${expressionId}`);
  const expressionRecord = expressions[expressionId];

  if (!expressionRecord) {
    throw new Error(`Unknown expression ${expressionId} for predicate ${predicate}`);
  }

  if (expressionRecord.oneOf) {
    let errors = null;

    for (const option of expressionRecord.oneOf) {
      const optionResult = parseExpression(docSet, node, predicate, option);

      if (!optionResult.errors) {
        return optionResult;
      } else if (!errors || (optionResult.errors.length < errors.length)) {
        errors = optionResult.errors;
      }
    }
    return { errors: errors };
  } else {
    const matches = xre.exec(predicate, expressionRecord.regex);

    if (matches) {
      const reResult = parseRegexExpression(docSet, node, predicate, expressionId, matches);
      return reResult;
    } else {
      return { errors: `Could not match ${predicate} to ${expressionId}` };
    }
  }
};

const doPredicate = (docSet, result, predicateString) => ({
  data: result.data.filter(node => {
    const nodeResult = parseExpression(docSet, node, predicateString, 'booleanExpression');

    // console.log();
    if (nodeResult.errors) {
      throw new Error(`Predicate - ${nodeResult.errors}`);
    }
    return nodeResult.data;
  }),
});

module.exports = { doPredicate };
