import xre from 'xregexp';
import itemGroupType from './itemGroup';
const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} = require('graphql');
const {
  headerBytes,
} = require('proskomma-utils');
const { dumpBlock } = require('../lib/dump');
const itemType = require('./item');

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

const blockType = new GraphQLObjectType({
  name: 'Block',
  description: 'Part of a sequence, roughly equivalent to a USFM paragraph',
  fields: () => ({
    cBL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The length in bytes of the succinct representation of c (block items)',
      resolve: root => root.c.length,
    },
    bgBL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The length in bytes of the succinct representation of bg (block grafts)',
      resolve: root => root.bg.length,
    },
    osBL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The length in bytes of the succinct representation of os (open scopes)',
      resolve: root => root.os.length,
    },
    isBL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The length in bytes of the succinct representation of is (included scopes)',
      resolve: root => root.is.length,
    },
    ntBL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The length in bytes of the succinct representation of nt (nextToken at the start of the block)',
      resolve: root => root.nt.length,
    },
    cL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of items in the succinct representation of c (block items)',
      resolve:
        (root, args, context) => context.docSet.countItems(root.c),
    },
    bgL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of items in the succinct representation of bg (block grafts)',
      resolve:
        (root, args, context) => context.docSet.countItems(root.bg),
    },
    osL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of items in the succinct representation of os (open scopes)',
      resolve:
        (root, args, context) => context.docSet.countItems(root.os),
    },
    isL: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of items in the succinct representation of is (included scopes)',
      resolve:
        (root, args, context) => context.docSet.countItems(root.is),
    },
    is: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of included scopes for this block',
      resolve:
        (root, args, context) => context.docSet.unsuccinctifyScopes(root.is),
    },
    os: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of open scopes for this block',
      resolve:
        (root, args, context) => context.docSet.unsuccinctifyScopes(root.os),
    },
    bs: {
      type: GraphQLNonNull(itemType),
      description: 'The block scope for this block',
      resolve:
        (root, args, context) => {
          const [itemLength, itemType, itemSubtype] = headerBytes(root.bs, 0);
          return context.docSet.unsuccinctifyScope(root.bs, itemType, itemSubtype, 0);
        },
    },
    bg: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of block grafts for this block',
      resolve:
        (root, args, context) => context.docSet.unsuccinctifyGrafts(root.bg),
    },
    nt: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The value of nextToken at the start of this block',
      resolve:
        root => root.nt.nByte(0),
    },
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of items from the c (content) field of the block',
      args: {
        withScopes: {
          type: GraphQLList(GraphQLString),
          description: 'Only return items that are within specific scopes',
        },
        anyScope: {
          type: GraphQLBoolean,
          description: 'If true, withScopes filtering matches items within at least one of the specified scopes',

        },
        withScriptureCV: {
          type: GraphQLString,
          description: 'Only return items that are within a chapterVerse range (ch or ch:v or ch:v-v or ch:v-ch:v)',
        },
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
        },
      },
      resolve:
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
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of tokens from the c (content) field of the block',
      args: {
        withScopes: {
          type: GraphQLList(GraphQLString),
          description: 'Only return tokens that are within specific scopes',
        },
        anyScope: {
          type: GraphQLBoolean,
          description: 'If true, withScopes filtering matches tokens within at least one of the specified scopes',
        },
        withScriptureCV: {
          type: GraphQLString,
          description: 'Only return tokens that are within a chapterVerse range (ch or ch:v or ch:v-v or ch:v-ch:v)',
        },
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
        },
        withChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return tokens whose payload is an exact match to one of the specified strings',
        },
        withMatchingChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return tokens whose payload matches one of the specified regexes',
        },
        withSubTypes: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return tokens with one of the specified subTypes',
        },
      },
      resolve:
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
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The text of the block as a single string',
      args: {
        withScriptureCV: {
          type: GraphQLString,
          description: 'Only return text that is within a chapterVerse range (ch or ch:v or ch:v-v or ch:v-ch:v)',
        },
        normalizeSpace: {
          type: GraphQLBoolean,
          description: 'If true, converts each whitespace character to a single space',
        },
      },
      resolve:
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
    },
    itemGroups: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemGroupType))),
      description: 'Block items grouped by scopes or milestones',
      args: {
        byScopes: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Produce one itemGroup for every different match of the list of scopes',
        },
        byMilestones: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Start a new itemGroup whenever a milestone in the list is encountered',
        },
      },
      resolve: (root, args, context) => {
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
    },
    dump: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The block content as a string in a compact eyeballable format',
      resolve:
        (root, args, context) => dumpBlock(context.docSet.unsuccinctifyBlock(root, {}, null)),
    },
    scopeLabels: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the labels for the block\'s bs, os and is scopes',
      args: {
        startsWith: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only include scopes that begin with this value',
        },
      },
      resolve:
        (root, args, context) =>
          [...context.docSet.unsuccinctifyBlockScopeLabelsSet(root)]
            .filter(s => !args.startsWith || scopeMatchesStartsWith(args.startsWith, s)),
    },
  }),
});

module.exports = blockType;
