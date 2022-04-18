const {
  GraphQLObjectType,
  GraphQLInt,
} = require('graphql');

const cvSchemaString = `
"""A chapter-verse reference"""
type cv {
  """The chapter number"""
  chapter: Int
  """The verse number"""
  verse: Int
}
`;

const cvResolvers = {
  chapter: root => root[0],
  verse: root => root[1],
};

const cvType = new GraphQLObjectType({
  name: 'cv',
  description: 'A chapter-verse reference',
  fields: () => ({
    chapter: {
      type: GraphQLInt,
      description: 'The chapter number',
      resolve: root => root[0],
    },
    verse: {
      type: GraphQLInt,
      description: 'The verse number',
      resolve: root => root[1],
    },
  }),
});

module.exports = {
  cvSchemaString,
  cvResolvers,
  cvType,
};
