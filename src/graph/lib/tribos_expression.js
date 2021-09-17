import xre from 'xregexp';

const aggregateFunctions = {
  ids: () => console.log('ids'),
  equals: (a, b) => a === b,
};

const parseFunctions = {
  csArgs: str => str.split(',').map(s => s.trim()),
  quotedString: str => str.substring(1, str.length - 1),
  idRef: () => console.log('idRef'),
  parentIdRef: () => console.log('parentIdRef'),
  contentRef: () => console.log('contentRef'),
  true: () => true,
  false: () => false,
};

const expressions = [
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

const doPredicate1 = (result, predicateString) => {
  for (const expression of expressions) {
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
        const parsed = parseFunctions[parseFunction](matches[n]);

        if (expression.argStructure) {
          console.log('aggregator!');
          const args = doPredicate1(result, parsed.map(p => doPredicate1(result, p)));
          console.log('args', args);
          // aggregateFunctions[expression.id](...args);
        } else {
          console.log('primitive!');
          console.log(parsed);
        }
      }

      if (!found) {
        console.log(`Could not parse predicate ${predicateString}`);
      }
    }
  }
  return result;
};

const doPredicate = (result, predicateString) => doPredicate1(result, predicateString);

module.exports = { doPredicate };
