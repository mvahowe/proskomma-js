const keyValueSchemaString = `
"""Key/Value tuple"""
type KeyValue {
    """The key"""
    key: String!
    """The value"""
    value: String!
}`;

const keyValueResolvers = {
  key: root => root[0],
  value: root => root[1],
};

module.exports = {
  keyValueSchemaString,
  keyValueResolvers,
};
