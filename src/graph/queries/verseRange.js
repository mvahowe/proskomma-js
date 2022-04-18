const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const verseRangeSchemaString = `
"""Information about a verse range (which may only cover one verse)"""
type verseRange {
  """The range, as it would be printed in a Bible"""
  range: String!
  """A list of verse numbers for this range"""
  numbers: [Int!]!
}
`;

const verseRangeType = new GraphQLObjectType({
  name: 'verseRange',
  description: 'Information about a verse range (which may only cover one verse)',
  fields: () => ({
    range: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The range, as it would be printed in a Bible',
      resolve: root => root.range,
    },
    numbers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt))),
      description: 'A list of verse numbers for this range',
      resolve: root => root.numbers,
    },
  }),
});

module.exports = { verseRangeSchemaString, verseRangeType };
