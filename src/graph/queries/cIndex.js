import { dumpItems } from '../lib/dump';

const cIndexSchemaString = `
"""A chapter index entry"""
type cIndex {
  """The chapter number"""
  chapter: Int!
  """The zero-indexed number of the block where the chapter starts"""
  startBlock: Int
  """The zero-indexed number of the block where the chapter ends"""
  endBlock: Int
  """The zero-indexed position of the item where the chapter starts"""
  startItem: Int
  """The zero-indexed position of the item where the chapter ends"""
  endItem: Int
  """The value of nextToken at the beginning of the chapter"""
  nextToken: Int
  """A list of items for this chapter"""
  items(
    """If true, adds scope and nextToken information to each token"""
    includeContext: Boolean
  ): [Item]!
  """The items as a string in a compact eyeballable format"""
  dumpItems: String
  """A list of tokens for this chapter"""
  tokens(
    """If true, adds scope and nextToken information to each token"""
    includeContext: Boolean
    """Return tokens whose payload is an exact match to one of the specified strings"""
    withChars: [String!]
    """Return tokens with one of the specified subTypes"""
    withSubTypes: [String!]
  ): [Item]!
  """The text of the chapter as a single string"""
  text(
    """If true, converts each whitespace character to a single space"""
    normalizeSpace: Boolean
  ): String!
}
`;

const cIndexResolvers = {
  chapter: root => root[0],
  startBlock: root => root[1].startBlock,
  endBlock: root => root[1].endBlock,
  startItem: root => root[1].startItem,
  endItem: root => root[1].endItem,
  nextToken: root => root[1].nextToken,
  items: (root, args, context) =>
    context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1], args.includeContext)
      .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b)), []),
  dumpItems: (root, args, context) => {
    const items = context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1], false);

    if (items.length > 0) {
      return dumpItems(items.reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b))));
    } else {
      return '';
    }
  },
  tokens: (root, args, context) =>
    context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1], args.includeContext)
      .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b)), [])
      .filter(
        i => i[0] === 'token' &&
          (!args.withChars || args.withChars.includes(i[2])) &&
          (!args.withSubTypes || args.withSubTypes.includes(i[1])),
      ),
  text: (root, args, context) => {
    let ret = context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1])
      .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b)), [])
      .filter(i => i[0] === 'token')
      .map(t => t[1] === 'lineSpace' ? ' ' : t[2])
      .join('')
      .trim();

    if (args.normalizeSpace) {
      ret = ret.replace(/[ \t\n\r]+/g, ' ');
    }
    return ret;
  },
};

export {
  cIndexSchemaString,
  cIndexResolvers,
};
