const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const {
  sequenceHasChars,
  sequenceHasMatchingChars,
  regexSearchTermIndexes,
  exactSearchTermIndexes,
} = require('../lib/sequence_chars');

const blockType = require('./block');
const itemType = require('./item');
const itemGroupType = require('./itemGroup');
const inputAttSpecType = require('./input_att_spec');

const options = {
  tokens: false,
  scopes: true,
  grafts: false,
  requiredScopes: [],
};

const blockHasAtts = (docSet, block, attSpecsArray, attValuesArray, requireAll) => {
  let matched = new Set([]);

  for (const item of docSet.unsuccinctifyPrunedItems(block, options, false)) {
    const [att, attType, element, key, count, value] = item[2].split('/');

    for (const [n, attSpecs] of attSpecsArray.entries()) {
      for (const attSpec of attSpecs) {
        if (
          attType === attSpec.attType &&
          element === attSpec.tagName &&
          key === attSpec.attKey &&
          parseInt(count) === attSpec.valueN &&
          attValuesArray[n].includes(value)
        ) {
          if (!requireAll) {
            return true;
          }
          matched.add(n);
          break;
        }
      }

      if (matched.size === attSpecsArray.length) {
        return true;
      }
    }
  }
  return false;
};

const sequenceType = new GraphQLObjectType({
  name: 'Sequence',
  description: 'A contiguous flow of content',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The id of the sequence',
    },
    type: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The type of the sequence (main, heading...)',
    },
    nBlocks: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of blocks in the sequence',
      resolve: root => root.blocks.length,
    },
    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(blockType))),
      description: 'The blocks in the sequence',
      args: {
        withScopes: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return blocks where the list of scopes is open',
        },
        positions: {
          type: GraphQLList(GraphQLNonNull(GraphQLInt)),
          description: 'Only return blocks whose zero-indexed position is in the list',
        },
        withBlockScope: {
          type: GraphQLString,
          description: 'Only return blocks with the specified block scope (eg \'blockScope/p\')',
        },
        withScriptureCV: {
          type: GraphQLString,
          description: 'Only return blocks that contain items within the specified chapter, verse or chapterVerse range',
        },
        attSpecs: {
          type: GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(inputAttSpecType)))),
          description: 'Ordered list of attribute specs whose values must match those in \'attValues\'',
        },
        attValues: {
          type: GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))),
          description: 'Ordered list of attribute values, used in conjunction with \'attSpecs\'',
        },
        allAtts: {
          type: GraphQLBoolean,
          description: 'If true, blocks where all attSpecs match will be included',
        },
        withChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return blocks containing a token whose payload is an exact match to one of the specified strings',
        },
        withMatchingChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return blocks containing a token whose payload matches the specified regexes',
        },
        allChars: {
          type: GraphQLBoolean,
          description: 'If true, blocks where all regexes match will be included',
        },
      },
      resolve: (root, args, context) => {
        context.docSet.maybeBuildEnumIndexes();

        if (args.withScopes && args.withScriptureCV) {
          throw new Error('Cannot specify both withScopes and withScriptureCV');
        }

        if (args.attSpecs && !args.attValues) {
          throw new Error('Cannot specify attSpecs without attValues');
        }

        if (!args.attSpecs && args.attValues) {
          throw new Error('Cannot specify attValues without attSpecs');
        }

        if (args.attSpecs && args.attValues && (args.attSpecs.length !== args.attValues.length)) {
          throw new Error('attSpecs and attValues must be same length');
        }

        if (args.withChars && args.withMatchingChars) {
          throw new Error('Cannot specify both withChars and withMatchingChars');
        }

        let ret = root.blocks;

        if (args.positions) {
          ret = Array.from(ret.entries()).filter(b => args.positions.includes(b[0])).map(b => b[1]);
        }

        if (args.withScopes) {
          ret = ret.filter(b => context.docSet.allScopesInBlock(b, args.withScopes));
        }

        if (args.withScriptureCV) {
          ret = context.docSet.blocksWithScriptureCV(ret, args.withScriptureCV);
        }

        if (args.attSpecs) {
          ret = ret.filter(b => blockHasAtts(context.docSet, b, args.attSpecs, args.attValues, args.allAtts || false));
        }

        if (args.withBlockScope) {
          ret = ret.filter(b => context.docSet.blockHasBlockScope(b, args.withBlockScope));
        }

        if (args.withChars) {
          if (
            root.type === 'main' &&
            !sequenceHasChars(context.docSet, root, args.withChars, args.allChars)
          ) {
            return [];
          }

          let charsIndexesArray = exactSearchTermIndexes(context.docSet, args.withChars, args.allChars);

          for (const charsIndexes of charsIndexesArray) {
            ret = ret.filter(b => context.docSet.blockHasChars(b, charsIndexes));
          }
        }

        if (args.withMatchingChars) {
          if (
            root.type === 'main' &&
            !sequenceHasMatchingChars(context.docSet, root, args.withMatchingChars, args.allChars)
          ) {
            return [];
          }

          let charsIndexesArray = regexSearchTermIndexes(context.docSet, args.withMatchingChars, args.allChars);

          for (const charsIndexes of charsIndexesArray) {
            ret = ret.filter(b => context.docSet.blockHasChars(b, charsIndexes));
          }
        }
        return ret;
      },
    },
    blocksItems: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))))),
      description: 'The items for each block in the sequence',
      resolve: (root, args, context) =>
        root.blocks.map(b => context.docSet.unsuccinctifyItems(b.c, {}, null)),
    },
    blocksTokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))))),
      description: 'The tokens for each block in the sequence',
      resolve: (root, args, context) =>
        root.blocks.map(b => context.docSet.unsuccinctifyItems(b.c, { tokens: true }, null)),
    },
    blocksText: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      args: {
        normalizeSpace: {
          type: GraphQLBoolean,
          description: 'If true, converts each whitespace character to a single space',
        },
      },
      description: 'The text for each block in the sequence',
      resolve: (root, args, context) =>
        root.blocks.map(
          b => {
            let ret = context.docSet
              .unsuccinctifyItems(b.c, { tokens: true }, null)
              .map(t => t[2])
              .join('');

            if (args.normalizeSpace) {
              ret = ret.replace(/[ \t\n\r]+/g, ' ');
            }
            return ret;
          },
        ),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        normalizeSpace: {
          type: GraphQLBoolean,
          description: 'If true, converts each whitespace character to a single space',
        },
      },
      description: 'The text for the sequence',
      resolve: (root, args, context) => {
        let ret = root.blocks.map(b => context.docSet
          .unsuccinctifyItems(b.c, { tokens: true }, null)
          .map(t => t[2])
          .join(''),
        ).join('\n');

        if (args.normalizeSpace) {
          ret = ret.replace(/[ \t\n\r]+/g, ' ');
        }
        return ret;
      },
    },
    itemGroups: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemGroupType))),
      description: 'Sequence content grouped by scopes or milestones',
      args: {
        byScopes: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Produce one itemGroup for every different match of the list of scopes',
        },
        byMilestones: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Start a new itemGroup whenever a milestone in the list is encountered',
        },
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
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
          return context.docSet.sequenceItemsByScopes(root.blocks, args.byScopes, args.includeContext || false);
        } else {
          return context.docSet.sequenceItemsByMilestones(root.blocks, args.byMilestones, args.includeContext || false);
        }
      },
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the tags of this sequence',
      resolve: root => Array.from(root.tags),
    },
    hasTag: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether or not the document has the specified tag',
      args: {
        tagName: {
          type: GraphQLNonNull(GraphQLString),
          description: 'Whether or not the document has the specified tag',
        },
      },
      resolve: (root, args) => root.tags.has(args.tagName),
    },
    wordLikes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of wordLike token strings in a main sequence',
      args: {
        coerceCase: {
          type: GraphQLString,
          description: 'Whether to coerce the strings (toLower|toUpper|none)',
        },
      },
      resolve: (root, args, context) => {
        if (root.type !== 'main') {
          throw new Error(`Only available for the main sequence, not ${root.type}`);
        }

        if (args.coerceCase && !['toLower', 'toUpper', 'none'].includes(args.coerceCase)) {
          throw new Error(`coerceCase, when present, must be 'toLower', 'toUpper' or 'none', not '${args.coerceCase}'`);
        }
        context.docSet.maybeBuildEnumIndexes();
        let tokens = new Set();
        let n = 0;

        for (const b of root.tokensPresent) {
          if (b) {
            const enumOffset = context.docSet.enumIndexes['wordLike'][n];
            let tokenString = context.docSet.enums['wordLike'].countedString(enumOffset);

            if (args.coerceCase === 'toLower') {
              tokenString = tokenString.toLowerCase();
            }

            if (args.coerceCase === 'toUpper') {
              tokenString = tokenString.toUpperCase();
            }
            tokens.add(tokenString);
          }
          n++;
        }
        return Array.from(tokens).sort();
      },
    },
    hasChars: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: `Returns true if a main sequence contains the specified tokens`,
      args: {
        chars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Token strings to be matched exactly',
        },
        allChars: {
          type: GraphQLBoolean,
          description: 'If true all tokens must match',
        },
      },
      resolve: (root, args, context) => {
        if (root.type !== 'main') {
          throw new Error(`Only available for the main sequence, not ${root.type}`);
        }

        return sequenceHasChars(context.docSet, root, args.chars, args.allChars || false);
      },
    },
    hasMatchingChars: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: `Returns true if a main sequence contains a match for specified regexes`,
      args: {
        chars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Regexes to be matched',
        },
        allChars: {
          type: GraphQLBoolean,
          description: 'If true all regexes must match',
        },
      },
      resolve: (root, args, context) => {
        if (root.type !== 'main') {
          throw new Error(`Only available for the main sequence, not ${root.type}`);
        }

        return sequenceHasMatchingChars(context.docSet, root, args.chars, args.allChars);
      },
    },
  }),
});

module.exports = sequenceType;
