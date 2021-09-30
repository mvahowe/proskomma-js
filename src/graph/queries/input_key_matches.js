const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const keyMatchesType = new GraphQLInputObjectType({
  name: 'KeyMatches',
  description: 'Key/Regex tuple',
  fields: () => ({
    key: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The key',
    },
    matches: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The regex to match',
    },
  }),
});

module.exports = keyMatchesType;
