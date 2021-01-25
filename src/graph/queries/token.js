const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
} = require('graphql');

const scopeMatchesStartsWith = (sw, s) => {
  if (sw.length === 0) {
    return true;
  }
  for (const swv of sw) {
    if (s.startsWith(swv)) {
      return true;
    }
  }
  return false;
};

const tokenType = new GraphQLObjectType({
  name: 'Token',
  fields: () => ({
    itemType: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[0],
    },
    subType: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[1],
    },
    chars: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root[2],
    },
    position: {
      type: GraphQLInt,
      resolve: root => root[3],
    },
    scopes: {
      type: GraphQLList(GraphQLNonNull(GraphQLString)),
      args: {
        startsWith: { type: GraphQLList(GraphQLNonNull(GraphQLString)) },
      },
      resolve: (root, args) =>
        root[4].filter(s => !args.startsWith || scopeMatchesStartsWith(args.startsWith, s)),
    },
    dump: {
      type: GraphQLNonNull(GraphQLString),
      resolve: (root) => `${root[1]} '${root[2]}'`,
    },
  }),
});

module.exports = tokenType;
