const selectorSpecSchemaString = `
"""Specification of a selector"""
type selectorSpec {
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

const selectorSpecResolvers = {
  regex: root => root.regex || null,
  min: root => root.min || null,
  max: root => root.max || null,
  enum: root => root.enum || null,
};

module.exports = {
  selectorSpecSchemaString,
  selectorSpecResolvers,
};
