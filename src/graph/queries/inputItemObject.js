const inputItemObjectSchemaString = `
"""Item for arguments"""
input InputItemObject {
    """The basic item type (token, scope or graft)'"""
    type: String!
    """The type-dependent subtype of the item"""
    subType: String!
    """The content of the item (the text for tokens, the label for scopes and the sequence id for grafts)"""
    payload: String!
}`;

module.exports = { inputItemObjectSchemaString };
