const {
  GraphQLObjectType,
  GraphQLList,
} = require('graphql');
const { cvVerseElementType } = require('./cvVerseElement');

const cvVersesSchemaString = `
"""Information about a verse in the chapter, which may be split into several pieces"""
type cvVerses {
  """The pieces of verse"""
  verse: [cvVerseElement]
}
`;

const cvVersesResolvers = {
  verse: root => root,
};

const cvVersesType = new GraphQLObjectType({
  name: 'cvVerses',
  description: 'Information about a verse in the chapter',
  fields: () => ({
    verse: {
      type: GraphQLList(cvVerseElementType),
      resolve: cvVersesResolvers.verse,
    },
  }),
});

module.exports = {
  cvVersesSchemaString,
  cvVersesResolvers,
  cvVersesType,
};
