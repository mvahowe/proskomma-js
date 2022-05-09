const keyMatchesSchemaString = `
"""Key/Regex tuple"""
input KeyMatches {
  """The key"""
  key: String!
  """The regex to match"""
  matches: String!
}
`;

export { keyMatchesSchemaString };
