import xre from 'xregexp';

const aggregateFunctions = {
  equals: (docSet, node, a, b) => a === b,
  and: (docSet, node, ...args) => args.filter(a => !a).length === 0,
  or: (docSet, node, ...args) => args.filter(a => a).length > 0,
  not: (docSet, node, a) => !a,
  idRef: (docSet, node) => docSet.unsuccinctifyScopes(node.bs)[0][2].split('/')[1],
  parentIdRef: (docSet, node) => docSet.unsuccinctifyScopes(node.is).filter(s => s[2].startsWith('tTreeParent'))[0][2].split('/')[1],
  contentRef: () => console.log('contentRef'),
  contains: (docSet, node, a, b) => a.includes(b),
  content: (docSet, node, label) => {
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
  matches: (docSet, node, a, b) => xre.test(a, xre(b)),
};

const parseFunctions = {
  quotedString: str => str.substring(1, str.length - 1),
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
    id: 'booleanExpression',
    oneOf: ['booleanPrimitive', 'equals', 'and', 'or', 'not', 'contains', 'startsWith', 'endsWith', 'matches'],
  },
  {
    id: 'equals',
    regex: xre('^==\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [2, 2]]],
  },
  {
    id: 'and',
    regex: xre('^and\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [2, null]]],
  },
  {
    id: 'or',
    regex: xre('^or\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [2, null]]],
  },
  {
    id: 'concat',
    regex: xre('^concat\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [2, null]]],
  },
  {
    id: 'content',
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
    argStructure: [['stringPrimitive', [2, 2]]],
  },
  {
    id: 'startsWith',
    regex: xre('^startsWith\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [2, 2]]],
  },
  {
    id: 'endsWith',
    regex: xre('^endsWith\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [2, 2]]],
  },
  {
    id: 'matches',
    regex: xre('^matches\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [2, 2]]],
  },
  {
    id: 'not',
    regex: xre('^not\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [1, 1]]],
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
    id: 'stringPrimitive',
    regex: xre('^(\'([^\']|\\\\\')*\')$'),
    parseFunctions: [null, 'quotedString'],
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
