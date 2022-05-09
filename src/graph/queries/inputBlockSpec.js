const inputBlockSpecSchemaString = `
"""A specification to create or update a block"""
input inputBlockSpec {
  """The block scope as an item"""
  bs: InputItemObject!
  """The block grafts as items"""
  bg: [InputItemObject!]!
  """The open scopes as items"""
  os: [InputItemObject!]!
  """The included scopes as items"""
  is: [InputItemObject!]!
  """The items"""
  items: [InputItemObject!]!
}
`;

export { inputBlockSpecSchemaString };
