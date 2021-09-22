const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const Tribos = require('../lib/tribos');

const nodeType = require('./node');

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

module.exports = treeSequenceType;
