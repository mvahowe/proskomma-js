const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const idPartsType = new GraphQLObjectType({
  name: 'idParts',
  description: 'Type-dependent parts of the ID header',
  fields: () => ({
    type: {
      type: GraphQLString,
      description: 'The type of the ID',
      resolve: root => root[0],
    },
    parts: {
      type: GraphQLList(GraphQLString),
      description: 'An array of parts of the ID',
      resolve: root => root[1],
    },
    part: {
      type: GraphQLString,
      description: 'A part of the ID, by index',
      args: { index: { type: GraphQLNonNull(GraphQLInt) } },
      resolve: (root, args) => {
        if (!root[1] || args.index < 0 || args.index >= root[1].length) {
          return null;
        }
        return root[1][args.index];
      },
    },
  }),
});

module.exports = idPartsType;
