const {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const { inputItemObjectType } = require('./inputItemObject');

const inputBlockSpecSchemaString = `
"""A specification to create or update a block"""
input inputBlockSpec {
  """The block scope as an item"""
  bs: InputItemObject!
  """The block grafts as items"""
  bg: [InputItemObject!]!
  """The open scopes as items"""
  os: [InputItemObject!]!
  """The included scopes as items"""
  is: [InputItemObject!]!
  """The items"""
  items: [InputItemObject!]!
}
`;

const inputBlockSpecType = new GraphQLInputObjectType({
  name: 'InputBlockSpec',
  description: 'A specification to create or update a block',
  fields: () => ({
    bs: {
      type: GraphQLNonNull(inputItemObjectType),
      description: 'The block scope as an item',
    },
    bg: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemObjectType))),
      description: 'The block grafts as items',
    },
    os: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemObjectType))),
      description: 'The open scopes as items',
    },
    is: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemObjectType))),
      description: 'The included scopes as items',
    },
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemObjectType))),
      description: 'The items',
    },
  }),
});

module.exports = {
  inputBlockSpecSchemaString,
  inputBlockSpecType,
};
