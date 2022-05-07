const inputKeyValueSchemaString = `
"""Input Key/Value Object"""
input InputKeyValue {
    """The key"""
    key: String!
    """The value"""
    value: String!
}
`;

module.exports = { inputKeyValueSchemaString };
