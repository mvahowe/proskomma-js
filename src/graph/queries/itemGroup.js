const { dumpItemGroup } = require('../lib/dump');

const scopeMatchesStartsWith = (sw, s) => {
  if (sw.length === 0) {
    return true;
  }

  for (const swv of sw) {
    if (s.startsWith(swv)) {
      return true;
    }
  }
  return false;
};

// [scopeLabels, items]

const itemGroupSchemaString = `
"""A collection of items, with scope context"""
type ItemGroup {
  """Items for this itemGroup"""
  items: [Item!]!
  """Tokens for this itemGroup"""
  tokens(
    """Return tokens whose payload is an exact match to one of the specified strings"""
    withChars: [String!]
    """Return tokens with one of the specified subTypes"""
    withSubTypes: [String!]
  ): [Item!]!
  """The text of the itemGroup as a single string"""
  text(
    """If true, converts each whitespace character to a single space"""
    normalizeSpace: Boolean
  ): String!
  """The labels of scopes that were open at the beginning of the itemGroup"""
  scopeLabels(
    """Only include scopes that begin with this value"""
    startsWith: [String!]
  ): [String!]!
  """The itemGroup content as a string in a compact eyeballable format"""
  dump: String!
  """A list of scopes from the items of the itemGroup"""
  includedScopes: [String!]!
} 
`;

const itemGroupResolvers = {
  items: root => root[1],
  tokens: (root, args) =>
    root[1].filter(i =>
      i[0] === 'token' &&
      (!args.withChars || args.withChars.includes(i[2])) &&
      (!args.withSubTypes || args.withSubTypes.includes(i[1])),
    ),
  text: (root, args) => {
    const tokensText = root[1].filter(i => i[0] === 'token').map(t => t[2]).join('');
    return args.normalizeSpace ? tokensText.replace(/[ \t\n\r]+/g, ' ') : tokensText;
  },
  scopeLabels: (root, args) =>
    root[0].filter(s => !args.startsWith || scopeMatchesStartsWith(args.startsWith, s)),
  dump: root => dumpItemGroup(root),
  includedScopes: root =>
    Array.from(
      new Set(
        root[1]
          .filter(i => i[0] === 'scope' && i[1] === 'start')
          .map(t => t[2]),
      ),
    ),
};

export {
  itemGroupSchemaString,
  itemGroupResolvers,
};
