const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const Tribos = require('../lib/tribos');

const { nodeType } = require('./node');
const { keyValueType } = require('./key_value');

const treeSequenceSchemaString = `
"""The nodes of a tree"""
type treeSequence {
  """The id of the sequence"""
  id: String!
  """The number of nodes in the tree sequence"""
  nNodes: Int!
  """The nodes in the tree sequence"""
  nodes: [node!]!
  """The JSON result for a Tribos query, as a string"""
  tribos(
    """The Tribos query string"""
    query: String!
  ): String!
  """The JSON results for the Tribos queries, as an array of strings"""
  triboi(
    """The Tribos query strings"""
    queries: [String!]!
  ): [String!]!
  """Tribos documentation"""
  tribosDoc: String!
  """A list of the tags of this sequence"""
  tags: [String!]!
  """A list of the tags of this sequence as key/value tuples"""
  tagsKv: [KeyValue!]!
  """Whether or not the sequence has the specified tag"""
  hasTag(
    """The tag name"""
    tagName: String
  ): Boolean!
}
`;

const treeSequenceResolvers = {
  nNodes: root => root.blocks.length,
  nodes: root => root.blocks,
  tribos: (root, args, context) =>
    new Tribos().parse(context.docSet, root.blocks, args.query),
  triboi: (root, args, context) =>
    args.queries.map(q => new Tribos().parse(context.docSet, root.blocks, q)),
  tribosDoc: () => new Tribos().doc(),
  tags: root => Array.from(root.tags),
  tagsKv: root => Array.from(root.tags).map(t => {
    if (t.includes(':')) {
      return [t.substring(0, t.indexOf(':')), t.substring(t.indexOf(':') + 1)];
    } else {
      return [t, ''];
    }
  }),
  hasTag: (root, args) => root.tags.has(args.tagName),
};

const treeSequenceType = new GraphQLObjectType({
  name: 'treeSequence',
  description: 'The nodes of a tree',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The id of the sequence',
    },
    nNodes: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of nodes in the tree sequence',
      resolve: treeSequenceResolvers.nNodes,
    },
    nodes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(nodeType))),
      description: 'The nodes in the tree sequence',
      resolve: treeSequenceResolvers.nodes,
    },
    tribos: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        query: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The Tribos query string',
        },
      },
      description: 'The JSON result for a Tribos query, as a string',
      resolve: treeSequenceResolvers.tribos,
    },
    triboi: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      args: {
        queries: {
          type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
          description: 'The Tribos query strings',
        },
      },
      description: 'The JSON results for the Tribos queries, as an array of strings',
      resolve: treeSequenceResolvers.triboi,
    },
    tribosDoc: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Tribos documentation',
      resolve: treeSequenceResolvers.tribosDoc,
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the tags of this sequence',
      resolve: treeSequenceResolvers.tags,
    },
    tagsKv: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(keyValueType))),
      description: 'A list of the tags of this sequence as key/value tuples',
      resolve: treeSequenceResolvers.tagsKv,
    },
    hasTag: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether or not the sequence has the specified tag',
      args: {
        tagName: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The tag name',
        },
      },
      resolve: treeSequenceResolvers.hasTag,
    },
  }),
});

module.exports = {
  treeSequenceSchemaString,
  treeSequenceResolvers,
  treeSequenceType,
};
