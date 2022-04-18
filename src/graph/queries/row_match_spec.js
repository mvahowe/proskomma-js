const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const rowMatchSpecType = new GraphQLInputObjectType({
  name: 'rowMatchSpec',
  description: 'Row Match Specification',
  fields: () => ({
    colN: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The position of the column in which to search a match',
    },
    matching: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The regex to match',
    },
  }),
});

module.exports = { rowMatchSpecType };
