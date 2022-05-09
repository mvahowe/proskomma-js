import xre from 'xregexp';
import { headerBytes } from 'proskomma-utils';
import { dumpBlock } from '../lib/dump';

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

const blockSchemaString = `
"""Part of a sequence, roughly equivalent to a USFM paragraph"""
type Block {
  """The length in bytes of the succinct representation of c (block items)"""
  cBL: Int!
  """The length in bytes of the succinct representation of bg (block grafts)"""
  bgBL: Int!
  """The length in bytes of the succinct representation of os (open scopes)"""
  osBL: Int!
  """The length in bytes of the succinct representation of is (included scopes)"""
  isBL: Int!
  """The length in bytes of the succinct representation of nt (nextToken at the start of the block)"""
  ntBL: Int!
  """The number of items in the succinct representation of c (block items)"""
  cL: Int!
  """The number of items in the succinct representation of bg (block grafts)"""
  bgL: Int!
  """The number of items in the succinct representation of os (open scopes)"""
  osL: Int!
  """The number of items in the succinct representation of is (included scopes)"""
  isL: Int!
  """A list of included scopes for this block"""
  is: [Item!]!
  """A list of open scopes for this block"""
  os: [Item!]!
  """The block scope for this block"""
  bs: Item!
  """A list of block grafts for this block"""
  bg: [Item!]!
  """The value of nextToken at the start of this block"""
  nt: Int!
  """A list of items from the c (content) field of the block"""
  items(
    """Only return items that are within specific scopes"""
    withScopes: [String!]
    """If true, withScopes filtering matches items within at least one of the specified scopes"""
    anyScope: Boolean
    """Only return items that are within a chapterVerse range (ch or ch:v or ch:v-v or ch:v-ch:v)"""
    withScriptureCV: String
    """If true, adds scope and nextToken information to each token"""
    includeContext: Boolean
  ) : [Item!]! 
  """A list of tokens from the c (content) field of the block"""
  tokens(
    """Only return tokens that are within specific scopes"""
    withScopes: [String!]
    """If true, withScopes filtering matches tokens within at least one of the specified scopes"""
    anyScope: Boolean
    """Only return tokens that are within a chapterVerse range (ch or ch:v or ch:v-v or ch:v-ch:v)"""
    withScriptureCV: String
    """If true, adds scope and nextToken information to each token"""
    includeContext: Boolean
    """Return tokens whose payload is an exact match to one of the specified strings"""
    withChars: [String!]
    """Return tokens whose payload matches one of the specified regexes"""
    withMatchingChars: [String!]
    """Return tokens with one of the specified subTypes"""
    withSubTypes: [String!]
  ) : [Item!]!
  """The text of the block as a single string"""
  text(
    """Only return text that is within a chapterVerse range (ch or ch:v or ch:v-v or ch:v-ch:v)"""
    withScriptureCV: String
    """If true, converts each whitespace character to a single space"""
    normalizeSpace: Boolean
  ): String!
  """'Block items grouped by scopes or milestones"""
  itemGroups(
    """Produce one itemGroup for every match of the list of scopes"""
    byScopes: [String!]
    """Start a new itemGroup whenever a milestone in the list is encountered"""
    byMilestones: [String!]
  ): [ItemGroup]!
  """The block content as a string in a compact eyeballable format"""
  dump: String!
  """A list of the labels for the block\\'s bs, os and is scopes"""
  scopeLabels(
    """Only include scopes that begin with this value"""
    startsWith: [String!]
  ): [String!]!
}
`;

const blockResolvers = {
  cBL: root => root.c.length,
  bgBL: root => root.bg.length,
  osBL: root => root.os.length,
  isBL: root => root.is.length,
  ntBL: root => root.nt.length,
  cL: (root, args, context) => context.docSet.countItems(root.c),
  bgL: (root, args, context) => context.docSet.countItems(root.bg),
  osL: (root, args, context) => context.docSet.countItems(root.os),
  isL: (root, args, context) => context.docSet.countItems(root.is),
  is: (root, args, context) => context.docSet.unsuccinctifyScopes(root.is),
  os: (root, args, context) => context.docSet.unsuccinctifyScopes(root.os),
  bs: (root, args, context) => {
    const [itemLength, itemType, itemSubtype] = headerBytes(root.bs, 0);
    return context.docSet.unsuccinctifyScope(root.bs, itemType, itemSubtype, 0);
  },
  bg: (root, args, context) => context.docSet.unsuccinctifyGrafts(root.bg),
  nt: root => root.nt.nByte(0),
  items:
    (root, args, context) => {
      if (args.withScopes && args.withScriptureCV) {
        throw new Error('Cannot specify both withScopes and withScriptureCV');
      }

      if (args.withScriptureCV) {
        return context.docSet.unsuccinctifyItemsWithScriptureCV(root, args.withScriptureCV, {}, args.includeContext || false);
      } else {
        return context.docSet.unsuccinctifyPrunedItems(
          root,
          {
            tokens: true,
            scopes: true,
            grafts: true,
            requiredScopes: args.withScopes || [],
            anyScope: args.anyScope || false,
          },
        );
      }
    },
  tokens:
    (root, args, context) => {
      if (Object.keys(args).filter(a => a.includes('Chars')).length > 1) {
        throw new Error('Only one of "withChars", "withAnyCaseChars" and "withCharsMatchingRegex" may be specified');
      }

      let ret;

      if (args.withScriptureCV) {
        ret = context.docSet.unsuccinctifyItemsWithScriptureCV(
          root,
          args.withScriptureCV,
          { tokens: true },
          args.includeContext || false,
        );
      } else {
        ret = context.docSet.unsuccinctifyPrunedItems(
          root,
          {
            tokens: true,
            scopes: true,
            requiredScopes: args.withScopes || [],
            anyScope: args.anyScope || false,
          },
        );
      }

      if (args.withSubTypes) {
        ret = ret.filter(i => args.withSubTypes.includes(i[1]));
      }

      if (args.withChars) {
        ret = ret.filter(i => args.withChars.includes(i[2]));
      } else if (args.withMatchingChars) {
        ret = ret.filter(i => {
          for (const re of args.withMatchingChars) {
            if (xre.test(i, xre(re))) {
              return true;
            }
          }
          return false;
        });
      }

      return ret.filter(i => i[0] === 'token');
    },
  text:
    (root, args, context) => {
      const tokens = args.withScriptureCV ?
        context.docSet.unsuccinctifyItemsWithScriptureCV(
          root,
          args.withScriptureCV,
          { tokens: true },
          false,
        ) :
        context.docSet.unsuccinctifyItems(root.c, { tokens: true }, null);
      let ret = tokens.map(t => t[2]).join('').trim();

      if (args.normalizeSpace) {
        ret = ret.replace(/[ \t\n\r]+/g, ' ');
      }
      return ret;
    },
  itemGroups: (root, args, context) => {
    if (args.byScopes && args.byMilestones) {
      throw new Error('Cannot specify both byScopes and byMilestones');
    }

    if (!args.byScopes && !args.byMilestones) {
      throw new Error('Must specify either byScopes or byMilestones');
    }

    if (args.byScopes) {
      return context.docSet.sequenceItemsByScopes([root], args.byScopes);
    } else {
      return context.docSet.sequenceItemsByMilestones([root], args.byMilestones);
    }
  },
  dump: (root, args, context) => dumpBlock(context.docSet.unsuccinctifyBlock(root, {}, null)),
  scopeLabels: (root, args, context) =>
    [...context.docSet.unsuccinctifyBlockScopeLabelsSet(root)]
      .filter(s => !args.startsWith || scopeMatchesStartsWith(args.startsWith, s)),
};

export {
  blockSchemaString,
  blockResolvers,
};
