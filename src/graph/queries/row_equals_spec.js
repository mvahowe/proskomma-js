const rowEqualsSpecSchemaString = `
"""Row Equals Specification"""
input rowEqualsSpec {
  """The position of the column in which to search a match"""
  colN: Int!
  """The values to match"""
  values: [String!]!
}
`;

export { rowEqualsSpecSchemaString };
