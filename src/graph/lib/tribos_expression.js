import xre from 'xregexp';

const aggregateFunctions = {
  ids: () => console.log('ids'),
  equals: (a, b) => a === b,
  and: (...args) => args.filter(a => !a).length === 0,
  or: (...args) => args.filter(a => a).length > 0,
  not: a => !a,
};

const parseFunctions = {
  quotedString: str => str.substring(1, str.length - 1),
  idRef: () => console.log('idRef'),
  parentIdRef: () => console.log('parentIdRef'),
  contentRef: () => console.log('contentRef'),
  true: () => true,
  false: () => false,
};

const splitArgs = str => {
  const ret = [[]];
  let pos = 0;
  let nParen = 0;

  while (pos < str.length) {
    switch(str[pos]) {
    case '(':
      ret[ret.length - 1].push(str[pos]);
      nParen++;
      break;
    case ')':
      ret[ret.length - 1].push(str[pos]);
      nParen--;
      break;
    case ',':
      if (nParen === 0) {
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
    oneOf: ['booleanPrimitive', 'equals', 'and', 'or', 'not'],
  },
  {
    id: 'ids',
    regex: xre('^#\\{([^}]+)\\}$'),
    argStructure: [['id', [1, null]]],
  },
  {
    id: 'id',
    regex: xre('^".*"$'),
    parseFunctions: ['quotedString'],
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
    id: 'not',
    regex: xre('^not\\((.+)\\)$'),
    argStructure: [['stringPrimitive', [1, 1]]],
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

const parseRegexExpression = (result, predicateString, expressionId, matches) => {
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
    const argRecords = splitArgs(matches[1]).map(a => parseExpressions(result, a));

    if (argRecords.filter(ar => ar.errors).length === 0) {
      const aggregated = aggregateFunctions[expressionId](...argRecords.map(ar => ar.data));
      console.log('aggregated', expressionId, argRecords, aggregated);
      return { data:  aggregated };
    }
    return { errors: `Could not parse arguments to ${expressionId}` };
  }
};

const parseExpressions = (result, predicateString) => {
  // console.log(`parseExpressions ${predicateString}`);

  for (const expressionRecord of expressions) {
    if (!expressionRecord.regex) {
      continue;
    }

    const matches = xre.exec(predicateString, expressionRecord.regex);

    if (matches) {
      return parseRegexExpression(result, predicateString, expressionRecord.id, matches);
    }
  }
  return { error: `No regex match for ${predicateString}` };
};

const parseExpression = (result, predicate, expressionId) => {
  // console.log(`parseExpression ${predicate}, ${expressionId}`);
  const expressionRecord = expressions.filter(e => e.id === expressionId)[0];

  if (!expressionRecord) {
    throw new Error(`Unknown expression ${expressionId} for predicate ${predicate}`);
  }

  if (expressionRecord.oneOf) {
    const errors = [];

    for (const option of expressionRecord.oneOf) {
      const optionResult = parseExpression(result, predicate, option);

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
      const reResult = parseRegexExpression(result, predicate, expressionId, matches);
      return reResult;
    } else {
      return { errors: `Could not match ${predicate} to ${expressionId}` };
    }
  }
};

const doPredicate = (result, predicateString) => {
  console.log('doPredicate', parseExpression(result, predicateString, 'booleanExpression'));
  return result;
};

module.exports = { doPredicate };
