const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
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

const itemType = new GraphQLObjectType({
  name: 'Item',
  description: 'Item',
  fields: () => ({
    type: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The basic item type (token, scope or graft)',
      resolve: root => root[0],
    },
    subType: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The type-dependent subtype of the item',
      resolve: root => root[1],
    },
    payload: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The content of the item (the text for tokens, the label for scopes and the sequence id for grafts)',
      args: { normalizeSpace: { type: GraphQLBoolean } },
      resolve: (root, args) => args.normalizeSpace ? root[2].replace(/[ \t\n\r]+/g, ' ') : root[2],
    },
    position: {
      type: GraphQLInt,
      description: 'If \'includeContext\' was selected, and for tokens, the index of the token from the start of the sequence',
      resolve: root => root[3],
    },
    scopes: {
      type: GraphQLList(GraphQLNonNull(GraphQLString)),
      description: 'If \'includeContext\' was selected, a list of scopes that are open around the item',
      args: {
        startsWith: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only include scopes that begin with this value',
        },
      },
      resolve: (root, args) =>
        root[4] ? root[4].filter(s => !args.startsWith || scopeMatchesStartsWith(args.startsWith, s)) : [],
    },
  }),
});

module.exports = itemType;
