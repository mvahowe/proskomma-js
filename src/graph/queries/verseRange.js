const verseRangeSchemaString = `
"""Information about a verse range (which may only cover one verse)"""
type verseRange {
  """The range, as it would be printed in a Bible"""
  range: String!
  """A list of verse numbers for this range"""
  numbers: [Int!]!
}
`;

module.exports = { verseRangeSchemaString };
