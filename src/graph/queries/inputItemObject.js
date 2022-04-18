const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const inputItemObjectType = new GraphQLInputObjectType({
  name: 'InputItemObject',
  description: 'Item for arguments',
  fields: () => ({
    type: {
      'type': GraphQLNonNull(GraphQLString),
      description: 'The basic item type (token, scope or graft)',
    },
    subType: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The type-dependent subtype of the item',
    },
    payload: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The content of the item (the text for tokens, the label for scopes and the sequence id for grafts)',
    },
  }),
});

module.exports = { inputItemObjectType };
