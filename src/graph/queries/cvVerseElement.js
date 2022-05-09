import { dumpItems } from '../lib/dump';

const cvVerseElementSchemaString = `
""""""
type cvVerseElement {
  """The zero-indexed number of the block where the verse starts"""
  startBlock: Int
  """The zero-indexed number of the block where the verse ends"""
  endBlock: Int
  """The zero-indexed position of the item where the verse starts"""
  startItem: Int
  """The zero-indexed position of the item where the verse ends"""
  endItem: Int
  """The value of nextToken at the beginning of the verse"""
  nextToken: Int
  """The verse range for this verse as it would be printed in a Bible"""
  verseRange: String
  """A list of items for this verse"""
  items(
    """If true, adds scope and nextToken information to each token"""
    includeContext: Boolean
  ): [Item]!
  """The items as a string in a compact eyeballable format"""
  dumpItems: String
  """A list of tokens for this verse"""
  tokens(
    """If true, adds scope and nextToken information to each token"""
    includeContext: Boolean
    """Return tokens whose payload is an exact match to one of the specified strings"""
    withChars: [String!]
    """Return tokens with one of the specified subTypes"""
    withSubTypes: [String!]
  ): [Item]!
  """The text of the verse as a single string"""
  text(
    """If true, converts each whitespace character to a single space"""
    normalizeSpace: Boolean
  ): String!
}
`;

const cvVerseElementResolvers = {
  startBlock: root => root.startBlock,
  endBlock: root => root.endBlock,
  startItem: root => root.startItem,
  endItem: root => root.endItem,
  nextToken: root => root.nextToken,
  verseRange: root => root.verses,
  items: (root, args, context) =>
    context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root, args.includeContext)
      .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b))),
  dumpItems: (root, args, context) =>
    dumpItems(
      context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root, args.includeContext)
        .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b))),
    ),
  tokens: (root, args, context) =>
    context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root, args.includeContext)
      .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b)))
      .filter(
        i =>
          i[0] === 'token' &&
          (!args.withChars || args.withChars.includes(i[2])) &&
          (!args.withSubTypes || args.withSubTypes.includes(i[1])),
      ),
  text: (root, args, context) => {
    let ret = context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root)
      .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b)))
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
  cvVerseElementSchemaString,
  cvVerseElementResolvers,
};
