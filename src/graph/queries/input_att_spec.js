const inputAttSpecSchemaString = `
"""Attribute Specification"""
input AttSpec {
"""The type of attribute, ie what type of thing it's connected to"""
attType: String!
"""The name of the USFM tag to which the attribute is connected"""
tagName: String!
"""The attribute key (ie the bit to the left of the equals sign in USX)"""
attKey: String!
"""The position of the value (which is 0 except for attributes with multiple values)"""
valueN: Int!
}`;

export { inputAttSpecSchemaString };
