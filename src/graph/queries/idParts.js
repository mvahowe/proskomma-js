const idPartsSchemaString = `
"""Type-dependent parts of the ID header"""
type idParts {
  """The type of the ID"""
  type: String
  """An array of parts of the ID"""
  parts: [String]
  """A part of the ID, by index"""
  part(
    """The numeric index of the part"""
    index: Int!
  ): String
}
`;

const idPartsResolvers = {
  type: root => root[0],
  parts: root => root[1],
  part: (root, args) => {
    if (!root[1] || args.index < 0 || args.index >= root[1].length) {
      return null;
    }
    return root[1][args.index];
  },
};

module.exports = {
  idPartsSchemaString,
  idPartsResolvers,
};
