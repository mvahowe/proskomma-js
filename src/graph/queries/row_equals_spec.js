const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
} = require('graphql');

const rowEqualsSpecSchemaString = `
"""Row Equals Specification"""
type rowEqualsSpec {
  """The position of the column in which to search a match"""
  colN: Int!
  """The values to match"""
  values: [String!]!
}
`;

const rowEqualsSpecType = new GraphQLInputObjectType({
  name: 'rowEqualsSpec',
  description: 'Row Equals Specification',
  fields: () => ({
    colN: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The position of the column in which to search a match',
    },
    values: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The values to match',
    },
  }),
});

module.exports = { rowEqualsSpecSchemaString, rowEqualsSpecType };
