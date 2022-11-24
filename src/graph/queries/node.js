import utils from "../../util";

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
    const [itemLength, itemType, itemSubtype] = utils.succinct.headerBytes(root.bs, 0);
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

export {
  nodeSchemaString,
  nodeResolvers,
};
