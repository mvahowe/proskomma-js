const {
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
} = require('graphql');
const { itemType } = require('./item');

const cellSchemaString = `
"""A table cell"""
type cell {
  """The row numbers"""
  rows: [Int!]!
  """The column numbers"""
  columns: [Int!]!
  """A list of items from the c (content) field of the cell"""
  items: [Item!]!
  """A list of tokens from the c (content) field of the cell"""
  tokens: [Item!]!
  """The text of the cell as a single string"""
  text(
    """If true, converts each whitespace character to a single space"""
    normalizeSpace: Boolean
  ): String!
}
`;

const cellResolvers = {
  rows: root => root[0],
  columns: root => root[1],
  items: root => root[2],
  tokens: root => root[2].filter(i => i[0] === 'token'),
  text: (root, args) => {
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
};

const cellType = new GraphQLObjectType({
  name: 'cell',
  description: 'A table cell',
  fields: () => ({
    rows: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt))),
      description: 'The row numbers',
      resolve: cellResolvers.rows,
    },
    columns: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt))),
      description: 'The column numbers',
      resolve: cellResolvers.columns,
    },
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of items from the c (content) field of the cell',
      resolve: cellResolvers.items,
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      description: 'A list of tokens from the c (content) field of the cell',
      resolve: cellResolvers.tokens,
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
      resolve: cellResolvers.text,
    },
  }),
});

module.exports = {
  cellSchemaString,
  cellResolvers,
  cellType,
};
