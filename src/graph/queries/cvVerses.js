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

const cvVersesType = new GraphQLObjectType({
  name: 'cvVerses',
  description: 'Information about a verse in the chapter',
  fields: () => ({
    verse: {
      type: GraphQLList(cvVerseElementType),
      resolve: root => root,
    },
  }),
});

module.exports = {
  cvVersesSchemaString,
  cvVersesType,
};
