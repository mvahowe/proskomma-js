const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const inputAttSpecSchemaString = `
"""Attribute Specification"""
type AttSpec {
"""The type of attribute, ie what type of thing it's connected to"""
attType: String!
"""The name of the USFM tag to which the attribute is connected"""
tagName: String!
"""The attribute key (ie the bit to the left of the equals sign in USX)"""
attKey: String!
"""The position of the value (which is 0 except for attributes with multiple values)"""
valueN: Int!
}`;

const inputAttSpecType = new GraphQLInputObjectType({
  name: 'AttSpec',
  description: 'Attribute Specification',
  fields: () => ({
    attType: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The type of attribute, ie what type of thing it\'s connected to',
    },
    tagName: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The name of the USFM tag to which the attribute is connected',
    },
    attKey: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The attribute key (ie the bit to the left of the equals sign in USX)',
    },
    valueN: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The position of the value (which is 0 except for attributes with multiple values)',
    },
  }),
});

module.exports = {
  inputAttSpecSchemaString,
  inputAttSpecType,
};
