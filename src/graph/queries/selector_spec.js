const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

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

module.exports = { selectorSpecType };
