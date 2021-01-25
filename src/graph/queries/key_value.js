const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const keyValueType = new GraphQLObjectType({
  name: 'KeyValue',
  fields: () => ({
    key: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[0],
    },
    value: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[1],
    },
  }),
});

module.exports = keyValueType;
