const kvEntrySchemaString = `
"""Key/Items tuple"""
type kvEntry {
    """The key"""
    key: String!
    """The secondary keys"""
    secondaryKeys: [KeyValue!]
    """The fields as itemGroups"""
    itemGroups: [ItemGroup]!
}`;

const kvEntryResolvers = {
  key: root => root[0],
  secondaryKeys: root => root[1],
  itemGroups: root => root[2],
};

export {
  kvEntrySchemaString,
  kvEntryResolvers,
};
