const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');
const { headerBytes } = require('proskomma-utils');

const options = {
  tokens: false,
  scopes: true,
  grafts: false,
  requiredScopes: [],
};

const tableSequenceType = new GraphQLObjectType({
  name: 'tableSequence',
  description: 'A contiguous flow of content for a table',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The id of the sequence',
    },
    nCells: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of cells in the table sequence',
      resolve: root => root.blocks.length,
    },
    nRows: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of rows in the table sequence',
      resolve: (root, args, context) => {
        const rowNs = new Set([]);

        for (const block of root.blocks) {
          const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
          const bsPayload = context.docSet.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0)[2];
          rowNs.add(bsPayload.split('/')[1]);
        }
        return rowNs.size;
      },
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

module.exports = tableSequenceType;
