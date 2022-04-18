const {
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
} = require('graphql');
const { itemType } = require('./item');

const cellType = new GraphQLObjectType({
  name: 'cell',
  description: 'A table cell',
  fields: () => ({
    rows: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt))),
      description: 'The row numbers',
      resolve: root => root[0],
    },
    columns: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt))),
      description: 'The column numbers',
      resolve: root => root[1],
    },
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of items from the c (content) field of the cell',
      resolve: root => root[2],
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of tokens from the c (content) field of the cell',
      resolve: root => root[2].filter(i => i[0] === 'token'),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The text of the cell as a single string',
      args: {
        normalizeSpace: {
          type: GraphQLBoolean,
          description: 'If true, converts each whitespace character to a single space',
        },
      },
      resolve: (root, args) => {
        let ret = root[2]
          .filter(i => i[0] === 'token')
          .map(t => t[2])
          .join('')
          .trim();

        if (args.normalizeSpace) {
          ret = ret.replace(/[ \t\n\r]+/g, ' ');
        }
        return ret;
      },
    },
  }),
});

module.exports = {cellType};
