const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const selectorSpecSchemaString = `
"""Specification of a selector"""
type selectorSpec {
  """Name (ie the key)"""
  name: String!
  """Data type (string or integer)"""
  type: String!
  """Regex for validating string selector"""
  regex: String
  """Inclusive minimum value for integer selector"""
  min: String
  """Inclusive maximum value for integer selector"""
  max: String
  """Enum of permitted string values"""
  enum: [String!]
}
`;

const selectorSpecResolvers = {
  regex: root => root.regex || null,
  min: root => root.min || null,
  max: root => root.max || null,
  enum: root => root.enum || null,
};

const selectorSpecType = new GraphQLObjectType({
  name: 'selectorSpec',
  description: 'Specification of a selector',
  fields: () => ({
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Name (ie the key)',
      resolve: root => root.name,
    },
    type: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Data type (string or integer)',
      resolve: root => root.type,
    },
    regex: {
      type: GraphQLString,
      description: 'Regex for validating string selector',
      resolve: root => root.regex || null,
    },
    min: {
      type: GraphQLString,
      description: 'Inclusive minimum value for integer selector',
      resolve: root => root.min || null,
    },
    max: {
      type: GraphQLString,
      description: 'Inclusive maximum value for integer selector',
      resolve: root => root.max || null,
    },
    enum: {
      type: GraphQLList(GraphQLNonNull(GraphQLString)),
      description: 'Enum of permitted string values',
      resolve: root => root.enum || null,
    },
  }),
});

module.exports = {
  selectorSpecSchemaString,
  selectorSpecResolvers,
  selectorSpecType,
};
