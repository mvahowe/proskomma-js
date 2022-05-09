const regexIndexSchemaString = `
"""Information about a regex match on an enum"""
type regexIndex {
    """The index in the enum"""
    index: String!
    """The string in the enum that matched"""
    matched: String!
}`;

const regexIndexResolvers = {
  index: root => root[0],
  matched: root => root[1],
};

export {
  regexIndexSchemaString,
  regexIndexResolvers,
};
