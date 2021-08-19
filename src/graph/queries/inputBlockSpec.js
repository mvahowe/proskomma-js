const {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const inputItemType = require('./inputItemObject');

const inputBlockSpecType = new GraphQLInputObjectType({
  name: 'InputBlockSpec',
  description: 'A specification to create or update a block',
  fields: () => ({
    bs: {
      type: GraphQLNonNull(inputItemType),
      description: 'The block scope as an item',
    },
    bg: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemType))),
      description: 'The block grafts as items',
    },
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemType))),
      description: 'The items',
    },
  }),
});

module.exports = inputBlockSpecType;
