const cvChapterSchemaString = `
"""Information for a chapter"""
type cvChapter {
  """The chapter"""
  chapter: Int!
  """The maximum verse number"""
  maxVerse: Int!
}
`;

const cvChapterResolvers = {
  chapter: root => parseInt(root[0]),
  maxVerse: root => parseInt(root[1]),
};

export { cvChapterSchemaString, cvChapterResolvers };
