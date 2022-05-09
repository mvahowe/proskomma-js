const origSchemaString = `
"""Mapped verse information"""
type orig {
  """The book code"""
  book: String
  """A list of chapter-verse references"""
  cvs: [cv!]!
}
`;

export { origSchemaString };
