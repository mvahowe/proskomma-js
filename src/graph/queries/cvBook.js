const cvBookSchemaString = `
"""Chapter/verse information for a book"""
type cvBook {
  """The bookCode"""
  bookCode: String!
  """The chapter records"""
  chapters: [cvChapter!]!
}
`;

const cvBookResolvers = {
  bookCode: root => root[0],
  chapters: root => Object.entries(root[1]),
}

export { cvBookSchemaString, cvBookResolvers };
