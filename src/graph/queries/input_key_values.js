const keyValuesSchemaString = `
"""Input Key/Values Object"""
input KeyValues {
    """The key"""
    key: String!
    """The values"""
    values: [String!]!
}
`;


module.exports = { keyValuesSchemaString };
