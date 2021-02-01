const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const inputItemObjectType = new GraphQLInputObjectType({
  name: 'InputItemObject',
  fields: () => ({
    type: { 'type': GraphQLNonNull(GraphQLString) },
    subType: { type: GraphQLNonNull(GraphQLString) },
    payload: { type: GraphQLNonNull(GraphQLString) },
  }),
});

module.exports = inputItemObjectType;
