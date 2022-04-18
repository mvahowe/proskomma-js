const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const inputKeyValueType = new GraphQLInputObjectType({
  name: 'InputKeyValue',
  description: 'Key/Value tuple for arguments',
  fields: () => ({
    key: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The key',
    },
    value: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The value',
    },
  }),
});

module.exports = { inputKeyValueType };
