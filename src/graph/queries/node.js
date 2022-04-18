const {
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} = require('graphql');
const { headerBytes } = require('proskomma-utils');
const { itemGroupType } = require('./itemGroup');

const nodeType = new GraphQLObjectType({
  name: 'node',
  description: 'A tree node',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The node id',
      resolve: (root, args, context) => {
        const [itemLength, itemType, itemSubtype] = headerBytes(root.bs, 0);
        return context.docSet.unsuccinctifyScope(root.bs, itemType, itemSubtype, 0)[2].split('/')[1];
      },
    },
    parentId: {
      type: GraphQLString,
      description: 'The node parent id',
      resolve: (root, args, context) => {
        const parentId = context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeParent'))[0][2].split('/')[1];
        return parentId === 'none' ? null: parentId;
      },
    },
    keys: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The keys for content',
      resolve: (root, args, context) => context.docSet.unsuccinctifyScopes(root.is)
        .filter(s => s[2].startsWith('tTreeContent'))
        .map(s => s[2].split('/')[1]),
    },
    itemGroups: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemGroupType))),
      includeContext: {
        type: GraphQLBoolean,
        description: 'If true, adds scope and nextToken information to each token',
      },
      description: 'The content as itemGroups',
      resolve: (root, args, context) =>
        context.docSet.sequenceItemsByScopes([root], ['tTreeContent/'], args.includeContext || false),
    },
    childIds: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The node children ids',
      resolve: (root, args, context) =>
        context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeChild'))
          .map(s => s[2].split('/')[2]),
    },
  }),
});

module.exports = { nodeType };
