const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');
const { headerBytes } = require('proskomma-utils');

const cellType = require('./cell_type');

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
    nColumns: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of columns in the table sequence',
      resolve: (root, args, context) => {
        const columnNs = new Set([]);

        for (const block of root.blocks) {
          for (const scope of context.docSet.unsuccinctifyScopes(block.is).map(s => s[2])) {
            if (scope.startsWith('tTableCol')) {
              columnNs.add(scope.split('/')[1]);
            }
          }
        }
        return columnNs.size;
      },
    },
    cells: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(cellType))),
      description: 'The cells in the table sequence',
      resolve: (root, args, context) => {
        const ret = [];

        for (const block of root.blocks) {
          ret.push([
            context.docSet.unsuccinctifyScopes(block.bs)
              .map(s => parseInt(s[2].split('/')[1])),
            Array.from(new Set(
              context.docSet.unsuccinctifyScopes(block.is)
                .filter(s => s[2].startsWith('tTableCol'))
                .map(s => parseInt(s[2].split('/')[1])),
            )),
            context.docSet.unsuccinctifyItems(block.c, {}, 0),
          ]);
        }
        return ret;
      },
    },
    rows: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(cellType))))),
      description: 'The rows in the table sequence',
      resolve: (root, args, context) => {
        const ret = [];
        let row = -1;

        for (const block of root.blocks) {
          const rows = context.docSet.unsuccinctifyScopes(block.bs)
            .map(s => parseInt(s[2].split('/')[1]));

          if (rows[0] !== row) {
            ret.push([]);
            row = rows[0];
          }
          ret[ret.length - 1].push([
            rows,
            Array.from(new Set(
              context.docSet.unsuccinctifyScopes(block.is)
                .filter(s => s[2].startsWith('tTableCol'))
                .map(s => parseInt(s[2].split('/')[1])),
            )),
            context.docSet.unsuccinctifyItems(block.c, {}, 0),
          ]);
        }
        // console.log(JSON.stringify(ret, null, 2));
        return ret;
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
