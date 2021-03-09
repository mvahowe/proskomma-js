const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const itemType = require('./item');

const cIndexType = new GraphQLObjectType({
  name: 'cIndex',
  fields: () => ({
    chapter: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root[0],
    },
    startBlock: {
      type: GraphQLInt,
      resolve: root => root[1].startBlock,
    },
    endBlock: {
      type: GraphQLInt,
      resolve: root => root[1].endBlock,
    },
    startItem: {
      type: GraphQLInt,
      resolve: root => root[1].startItem,
    },
    endItem: {
      type: GraphQLInt,
      resolve: root => root[1].endItem,
    },
    items: {
      type: GraphQLNonNull(GraphQLList(itemType)),
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1])
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b)), []),
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(itemType)),
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1])
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b)), [])
          .filter(i => i[0] === 'token'),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1])
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b)), [])
          .filter(i => i[0] === 'token')
          .map(t => t[1] === 'lineSpace' ? ' ' : t[2])
          .join('')
          .trim(),
    },
  }),
});

module.exports = cIndexType;
