const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const keyValueType = new GraphQLObjectType({
  name: 'KeyValue',
  description: 'Key/Value tuple',
  fields: () => ({
    key: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The key',
      resolve: root => root[0],
    },
    value: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The value',
      resolve: root => root[1],
    },
  }),
});

module.exports = keyValueType;
