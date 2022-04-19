const {
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} = require('graphql');
const { headerBytes } = require('proskomma-utils');
const { itemGroupType } = require('./itemGroup');

const nodeSchemaString = `
"""A tree node"""
type node {
  """The node id"""
  id: String!
  """The node parent id"""
  parentId: String
  """The keys for content"""
  keys: [String!]!
  """The content as itemGroups"""
  itemGroups(
    """If true, adds scope and nextToken information to each token"""
    includeContext: Boolean
  ): [ItemGroup!]!
  """The node children ids"""
  childIds: [String!]!
}
`;

const nodeResolvers = {
  id: (root, args, context) => {
    const [itemLength, itemType, itemSubtype] = headerBytes(root.bs, 0);
    return context.docSet.unsuccinctifyScope(root.bs, itemType, itemSubtype, 0)[2].split('/')[1];
  },
  parentId: (root, args, context) => {
    const parentId = context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeParent'))[0][2].split('/')[1];
    return parentId === 'none' ? null: parentId;
  },
  keys: (root, args, context) => context.docSet.unsuccinctifyScopes(root.is)
    .filter(s => s[2].startsWith('tTreeContent'))
    .map(s => s[2].split('/')[1]),
  itemGroups: (root, args, context) =>
    context.docSet.sequenceItemsByScopes([root], ['tTreeContent/'], args.includeContext || false),
  childIds: (root, args, context) =>
    context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeChild'))
      .map(s => s[2].split('/')[2]),
};

const nodeType = new GraphQLObjectType({
  name: 'node',
  description: 'A tree node',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The node id',
      resolve: nodeResolvers.id,
    },
    parentId: {
      type: GraphQLString,
      description: 'The node parent id',
      resolve: nodeResolvers.parentId,
    },
    keys: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The keys for content',
      resolve: nodeResolvers.keys,
    },
    itemGroups: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemGroupType))),
      args: {
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
        },
      },
      description: 'The content as itemGroups',
      resolve: nodeResolvers.itemGroups,
    },
    childIds: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The node children ids',
      resolve: nodeResolvers.childIds,
    },
  }),
});

module.exports = {
  nodeSchemaString,
  nodeResolvers,
  nodeType,
};
