const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const keyMatchesSchemaString = `
"""Key/Regex tuple"""
input KeyMatches {
  """The key"""
  key: String!
  """The regex to match"""
  matches: String!
}
`;

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

module.exports = { keyMatchesSchemaString, keyMatchesType };
