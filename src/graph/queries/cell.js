const cellSchemaString = `
"""A table cell"""
type cell {
  """The row numbers"""
  rows: [Int!]!
  """The column numbers"""
  columns: [Int!]!
  """A list of items from the c (content) field of the cell"""
  items: [Item!]!
  """A list of tokens from the c (content) field of the cell"""
  tokens: [Item!]!
  """The text of the cell as a single string"""
  text(
    """If true, converts each whitespace character to a single space"""
    normalizeSpace: Boolean
  ): String!
}
`;

const cellResolvers = {
  rows: root => root[0],
  columns: root => root[1],
  items: root => root[2],
  tokens: root => root[2].filter(i => i[0] === 'token'),
  text: (root, args) => {
    let ret = root[2]
      .filter(i => i[0] === 'token')
      .map(t => t[2])
      .join('')
      .trim();

    if (args.normalizeSpace) {
      ret = ret.replace(/[ \t\n\r]+/g, ' ');
    }
    return ret;
  },
};

export {
  cellSchemaString,
  cellResolvers,
};
