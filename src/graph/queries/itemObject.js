const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const scopeType = new GraphQLObjectType({
  name: 'ItemObject',
  fields: () => ({
    type: { 'type': GraphQLNonNull(GraphQLString) },
    subType: { type: GraphQLNonNull(GraphQLString) },
    payload: { type: GraphQLNonNull(GraphQLString) },
  }),
});

module.exports = scopeType;
