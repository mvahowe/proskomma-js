const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} = require('graphql');

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

const regexIndexType = new GraphQLObjectType({
  name: 'regexIndex',
  description: 'Information about a regex match on an enum',
  fields: () => ({
    index: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The index in the enum',
      resolve: root => root[0],
    },
    matched: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The string in the enum that matched',
      resolve: root => root[1],
    },
  }),
});

module.exports = {
  regexIndexSchemaString,
  regexIndexResolvers,
  regexIndexType,
};
