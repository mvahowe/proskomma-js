const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} = require('graphql');
const tokenType = require('./token');
const itemType = require('./item');

// [items, scopeLabels]

const itemGroupType = new GraphQLObjectType({
  name: 'ItemGroup',
  fields: () => ({
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      resolve: (root, args, context) => root[1],
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      resolve: (root, args, context) =>
        root[1].filter(i => i[0] === 'token'),
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
