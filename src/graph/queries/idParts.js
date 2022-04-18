const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const idPartsSchemaString = `
"""Type-dependent parts of the ID header"""
type idParts {
  """The type of the ID"""
  type: String
  """An array of parts of the ID"""
  parts: [String]
  """A part of the ID, by index"""
  part: String
}
`;

const idPartsResolvers = {
  type: root => root[0],
  parts: root => root[1],
  part: (root, args) => {
    if (!root[1] || args.index < 0 || args.index >= root[1].length) {
      return null;
    }
    return root[1][args.index];
  },
};

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
      args: {
        index: {
          type: GraphQLNonNull(GraphQLInt),
          description: 'The numeric index of the part',
        },
      },
      resolve: idPartsResolvers.part,
    },
  }),
});

module.exports = {
  idPartsSchemaString,
  idPartsResolvers,
  idPartsType,
};
