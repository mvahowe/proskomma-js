const versificationSchemaString = `
"""Information about a standard versification scheme"""
type versification {
  """id, derived from the Paratext vrs filename"""
  id: String!
  """A string of the original vrs file"""
  vrs: String!
  """Chapter/verse information for each book"""
  cvBooks: [cvBook!]!
  """Chapter/verse information for one book"""
  cvBook(
    """The bookCode"""
    bookCode: String!
  ): cvBook!
}
`;

const versificationResolvers = {
  id: root => root[0],
  vrs: root => root[1].raw,
  cvBooks: root => Object.entries(root[1].cv),
  cvBook: (root, args) => Object.entries(root[1].cv).filter(b => b[0] === args.bookCode)[0],
}

export { versificationSchemaString, versificationResolvers };
