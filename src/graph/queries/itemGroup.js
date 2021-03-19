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
  fields: () => ({
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      resolve: (root, args, context) => root[1],
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      args: { withChars: { type: GraphQLList(GraphQLNonNull(GraphQLString)) } },
      resolve: (root, args, context) =>
        root[1].filter(i => i[0] === 'token' && (!args.withChars || args.withChars.includes(i[2]))),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      resolve: (root, args, context) =>
        root[1].filter(i => i[0] === 'token').map(t => t[2]).join(''),
    },
    scopeLabels: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      resolve: (root, args, context) => root[0],
    },
  }),
});

module.exports = itemGroupType;
