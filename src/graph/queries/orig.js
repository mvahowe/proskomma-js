const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const { cvType } = require('./cv');

const origSchemaString = `
"""Mapped verse information"""
type orig {
  """The book code"""
  book: String
  """A list of chapter-verse references"""
  cvs: [cv!]!
}
`;

const orig = new GraphQLObjectType({
  name: 'orig',
  description: 'Mapped verse information',
  fields: () => ({
    book: {
      type: GraphQLString,
      description: 'The book code',
      resolve: root => root.book,
    },
    cvs: {
      type: GraphQLNonNull(GraphQLList(cvType)),
      description: 'A list of chapter-verse references',
      resolve: root => root.cvs,
    },
  }),
});
module.exports = {
  origSchemaString,
  orig,
};
