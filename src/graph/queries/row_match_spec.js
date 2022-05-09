const rowMatchSpecSchemaString = `
"""Row Match Specification"""
input rowMatchSpec {
  """The position of the column in which to search a match"""
  colN: Int!
  """The regex to match"""
  matching: String!
}
`;

export { rowMatchSpecSchemaString };
