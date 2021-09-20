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

  while (pos < str.length) {
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

const expressions = [
  {
    id: 'expression',
    oneOf: ['stringExpression', 'intExpression', 'booleanExpression'],
  },
  {
    id: 'booleanExpression',
    oneOf: ['booleanPrimitive', 'equals', 'notEqual', 'and', 'or', 'not', 'contains', 'startsWith', 'endsWith', 'matches'],
  },
  {
    id: 'stringExpression',
    oneOf: ['concat', 'left', 'right', 'string', 'idRef', 'parentIdRef', 'stringPrimitive'],
  },
  {
    id: 'intExpression',
    oneOf: ['length', 'indexOf', 'int', 'nChildren', 'intPrimitive'],
  },
  {
    id: 'equals',
    regex: xre('^==\\((.+)\\)$'),
    argStructure: [['expression', [2, 2]]],
  },
  {
    id: 'notEqual',
    regex: xre('^!=\\((.+)\\)$'),
    argStructure: [['expression', [2, 2]]],
  },
  {
    id: 'and',
    regex: xre('^and\\((.+)\\)$'),
    argStructure: [['booleanExpression', [2, null]]],
  },
  {
    id: 'or',
    regex: xre('^or\\((.+)\\)$'),
    argStructure: [['booleanExpression', [2, null]]],
  },
  {
    id: 'concat',
    regex: xre('^concat\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, null]]],
  },
  {
    id: 'contentRef',
    regex: xre('^content\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [1, 1]]],
  },
  {
    id: 'hasContent',
    regex: xre('^hasContent\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [1, 1]]],
  },
  {
    id: 'contains',
    regex: xre('^contains\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  {
    id: 'startsWith',
    regex: xre('^startsWith\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  {
    id: 'endsWith',
    regex: xre('^endsWith\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  {
    id: 'matches',
    regex: xre('^matches\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  {
    id: 'left',
    regex: xre('^left\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]],['intExpression', [1, 1]]],
  },
  {
    id: 'right',
    regex: xre('^right\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]],['intExpression', [1, 1]]],
  },
  {
    id: 'length',
    regex: xre('^length\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]]],
  },
  {
    id: 'indexOf',
    regex: xre('^indexOf\\((.+)\\)$'),
    argStructure: [['stringExpression', [2, 2]]],
  },
  {
    id: 'not',
    regex: xre('^not\\((.+)\\)$'),
    argStructure: [['booleanExpression', [1, 1]]],
  },
  {
    id: 'int',
    regex: xre('^int\\((.+)\\)$'),
    argStructure: [['stringExpression', [1, 1]]],
  },
  {
    id: 'string',
    regex: xre('^string\\((.+)\\)$'),
    argStructure: [['intExpression', [1, 1]]],
  },
  {
    id: 'idRef',
    regex: xre('^id$'),
    argStructure: [],
  },
  {
    id: 'parentIdRef',
    regex: xre('^parentId$'),
    argStructure: [],
  },
  {
    id: 'nChildren',
    regex: xre('^nChildren$'),
    argStructure: [],
  },
  {
    id: 'add',
    regex: xre('^add\\((.+)\\)$'),
    argStructure: [['intExpression', [2, null]]],
  },
  {
    id: 'mul',
    regex: xre('^mul\\((.+)\\)$'),
    argStructure: [['intExpression', [2, null]]],
  },
  {
    id: 'sub',
    regex: xre('^sub\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  {
    id: 'div',
    regex: xre('^div\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  {
    id: 'mod',
    regex: xre('^mod\\((.+)\\)$'),
    argStructure: [['intExpression', [2, 2]]],
  },
  {
    id: 'stringPrimitive',
    regex: xre('^(\'([^\']|\\\\\')*\')$'),
    parseFunctions: [null, 'quotedString'],
  },
  {
    id: 'intPrimitive',
    regex: xre('^(-?[0-9]+)$'),
    parseFunctions: [null, 'int'],
  },
  {
    id: 'booleanPrimitive',
    regex: xre('^(true)|(false)$'),
    parseFunctions: [null, 'true', 'false'],
  },
];

const parseRegexExpression = (docSet, node, predicateString, expressionId, matches) => {
  // console.log(`parseRegexExpression ${predicateString} ${expressionId} ${matches}`);
  const expressionRecord = expressions.filter(e => e.id === expressionId)[0];

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
    let argRecords = [];

    if (expressionRecord.argStructure.length > 0) {
      argRecords = splitArgs(matches[1]).map(a => parseExpressions(docSet, node, a));
    }

    if (argRecords.filter(ar => ar.errors).length === 0) {
      // console.log(expressionId);
      const aggregated = aggregateFunctions[expressionId](docSet, node, ...argRecords.map(ar => ar.data));
      // console.log('aggregated', expressionId, argRecords, aggregated);
      return { data:  aggregated };
    }
    return { errors: `Could not parse arguments to ${expressionId}` };
  }
};

const parseExpressions = (docSet, node, predicateString) => {
  // console.log(`parseExpressions ${predicateString}`);

  for (const expressionRecord of expressions) {
    if (!expressionRecord.regex) {
      continue;
    }

    const matches = xre.exec(predicateString, expressionRecord.regex);

    if (matches) {
      return parseRegexExpression(docSet, node, predicateString, expressionRecord.id, matches);
    }
  }
  return { error: `No regex match for ${predicateString}` };
};

const parseExpression = (docSet, node, predicate, expressionId) => {
  // console.log(`parseExpression ${predicate}, ${expressionId}`);
  const expressionRecord = expressions.filter(e => e.id === expressionId)[0];

  if (!expressionRecord) {
    throw new Error(`Unknown expression ${expressionId} for predicate ${predicate}`);
  }

  if (expressionRecord.oneOf) {
    const errors = [];

    for (const option of expressionRecord.oneOf) {
      const optionResult = parseExpression(docSet, node, predicate, option);

      if (!optionResult.errors) {
        return optionResult;
      } else {
        errors.push(`Could not parse ${predicate} as ${option}`);
      }
    }
    return { errors: errors.join('; ') };
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
    return !nodeResult.errors && nodeResult.data;
  }),
});

module.exports = { doPredicate };
