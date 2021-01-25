const {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const inputAttSpecType = new GraphQLInputObjectType({
  name: 'AttSpec',
  fields: () => ({
    attType: {
      type: GraphQLNonNull(GraphQLString),
    },
    tagName: {
      type: GraphQLNonNull(GraphQLString),
    },
    attKey: {
      type: GraphQLNonNull(GraphQLString),
    },
    valueN: {
      type: GraphQLNonNull(GraphQLInt),
    },
  }),
});

module.exports = inputAttSpecType;
