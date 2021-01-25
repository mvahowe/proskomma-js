const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const graftType = new GraphQLObjectType({
  name: 'Graft',
  fields: () => ({
    itemType: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[0],
    },
    subType: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[1],
    },
    sequenceId: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[2],
    },
    dump: {
      type: GraphQLNonNull(GraphQLString),
      resolve: (root) => `${root[1]}->${root[2]}`,
    },
  }),
});

module.exports = graftType;
