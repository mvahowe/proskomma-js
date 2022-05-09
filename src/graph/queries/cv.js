const cvSchemaString = `
"""A chapter-verse reference"""
type cv {
  """The chapter number"""
  chapter: Int
  """The verse number"""
  verse: Int
}
`;

const cvResolvers = {
  chapter: root => root[0],
  verse: root => root[1],
};

export {
  cvSchemaString,
  cvResolvers,
};
