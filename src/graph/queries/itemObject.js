const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const itemObjectType = new GraphQLObjectType({
  name: 'ItemObject',
  fields: () => ({
    type: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[0],
    },
    subType: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[1],
    },
    payload: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[2],
    },
  }),
});

module.exports = itemObjectType;
