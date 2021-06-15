const {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');
const { dumpItemGroup } = require('../lib/dump');
const itemType = require('./item');

// [scopeLabels, items]

const itemGroupType = new GraphQLObjectType({
  name: 'ItemGroup',
  description: 'A collection of items, with scope context',
  fields: () => ({
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'Items for this itemGroup',
      resolve: (root, args, context) => root[1],
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'Tokens for this itemGroup',
      args: {
        withChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return tokens whose payload is an exact match to one of the specified strings',
        },
        withSubTypes: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return tokens with one of the specified subTypes',
        },
      },
      resolve: (root, args, context) =>
        root[1].filter(i =>
          i[0] === 'token' &&
          (!args.withChars || args.withChars.includes(i[2])) &&
          (!args.withSubTypes || args.withSubTypes.includes(i[1])),
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
      description: 'The text of the itemGroup as a single string',
      resolve: (root, args, context) => {
        const tokensText = root[1].filter(i => i[0] === 'token').map(t => t[2]).join('');
        return args.normalizeSpace? tokensText.replace(/[ \t\n\r]+/g, ' ') : tokensText;
      }
    },
    scopeLabels: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The labels of scopes that were open at the beginning of the itemGroup',
      resolve: (root, args, context) => root[0],
    },
    dump: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The itemGroup content as a string in a compact eyeballable format',
      resolve: root => dumpItemGroup(root),
    },
    /*
    includedScopes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of scopes from the items of the itemGroup',
      resolve: (root, args, context) =>
        Array.from(new Set(root[1].filter(i => i[0] === 'scope' && i[1] === 'start').map(t => t[2]))),
    },
 */
  }),
});

module.exports = itemGroupType;
