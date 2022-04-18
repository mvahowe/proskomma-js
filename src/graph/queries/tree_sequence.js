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
      resolve: root => root.blocks.length,
    },
    nodes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(nodeType))),
      description: 'The nodes in the tree sequence',
      resolve: (root, args, context) => {
        return root.blocks;
      },
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
      resolve: (root, args, context) => {
        return new Tribos().parse(context.docSet, root.blocks, args.query);
      },
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
      resolve: (root, args, context) => {
        return args.queries.map(q => new Tribos().parse(context.docSet, root.blocks, q));
      },
    },
    tribosDoc: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Tribos documentation',
      resolve: () => new Tribos().doc(),
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'A list of the tags of this sequence',
      resolve: root => Array.from(root.tags),
    },
    tagsKv: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(keyValueType))),
      description: 'A list of the tags of this sequence as key/value tuples',
      resolve: root => Array.from(root.tags).map(t => {
        if (t.includes(':')) {
          return [t.substring(0, t.indexOf(':')), t.substring(t.indexOf(':') + 1)];
        } else {
          return [t, ''];
        }
      }),
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
      resolve: (root, args) => root.tags.has(args.tagName),
    },
  }),
});

module.exports = { treeSequenceType };
