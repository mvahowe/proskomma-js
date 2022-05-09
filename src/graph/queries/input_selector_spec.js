const inputSelectorSpecSchemaString = `
"""Input specification of a selector"""
input inputSelectorSpec {
  """Name (ie the key)"""
  name: String!
  """Data type (string or integer)"""
  type: String!
  """Regex for validating string selector"""
  regex: String
  """Inclusive minimum value for integer selector"""
  min: String
  """Inclusive maximum value for integer selector"""
  max: String
  """Enum of permitted string values"""
  enum: [String!]
}
`;

export { inputSelectorSpecSchemaString };
