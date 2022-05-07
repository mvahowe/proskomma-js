const cvVersesSchemaString = `
"""Information about a verse in the chapter, which may be split into several pieces"""
type cvVerses {
  """The pieces of verse"""
  verse: [cvVerseElement]
}
`;

const cvVersesResolvers = { verse: root => root };



module.exports = {
  cvVersesSchemaString,
  cvVersesResolvers,
};
