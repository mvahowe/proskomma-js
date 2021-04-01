const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');
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
      },
      resolve: (root, args, context) =>
        root[1].filter(i => i[0] === 'token' && (!args.withChars || args.withChars.includes(i[2]))),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The text of the block as a single string',
      resolve: (root, args, context) =>
        root[1].filter(i => i[0] === 'token').map(t => t[2]).join(''),
    },
    scopeLabels: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The labels of scopes that were open at the beginning of the itemGroup',
      resolve: (root, args, context) => root[0],
    },
  }),
});

module.exports = itemGroupType;
