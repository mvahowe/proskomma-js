const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} = require('graphql');

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

module.exports = { regexIndexType };
