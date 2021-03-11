const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');
const itemType = require('./item');

const itemListType = new GraphQLObjectType({
  name: 'ItemList',
  fields: () => ({
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      resolve: root => root,
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      resolve: root => root.filter(i => i[0] === 'token'),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root.filter(i => i[0] === 'token').map(t => t[2]).join(''),
    },
  }),
});

module.exports = itemListType;
