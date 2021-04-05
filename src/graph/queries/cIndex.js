const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const { dumpItems } = require('../lib/dump');
const itemType = require('./item');

const cIndexType = new GraphQLObjectType({
  name: 'cIndex',
  description: 'A chapter index entry',
  fields: () => ({
    chapter: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The chapter number',
      resolve: root => root[0],
    },
    startBlock: {
      type: GraphQLInt,
      description: 'The zero-indexed number of the block where the chapter starts',
      resolve: root => root[1].startBlock,
    },
    endBlock: {
      type: GraphQLInt,
      description: 'The zero-indexed number of the block where the chapter ends',
      resolve: root => root[1].endBlock,
    },
    startItem: {
      type: GraphQLInt,
      description: 'The zero-indexed position of the item where the chapter starts',
      resolve: root => root[1].startItem,
    },
    endItem: {
      type: GraphQLInt,
      description: 'The zero-indexed position of the item where the chapter ends',
      resolve: root => root[1].endItem,
    },
    nextToken: {
      type: GraphQLInt,
      description: 'The value of nextToken at the beginning of the chapter',
      resolve: root => root[1].nextToken,
    },
    items: {
      type: GraphQLNonNull(GraphQLList(itemType)),
      description: 'A list of items for this chapter',
      args: {
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
        },
      },
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1], args.includeContext)
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b)), []),
    },
    dumpItems: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The items as a string in a compact eyeballable format',
      resolve: (root, args, context) => {
        const items = context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1], args.includeContext);

        if (items.length > 0) {
          return dumpItems(items.reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b))));
        } else {
          return '';
        }
      },
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(itemType)),
      description: 'A list of tokens for this chapter',
      args: {
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each token',
        },
        withChars: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Return tokens whose payload is an exact match to one of the specified strings',
        },
      },
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root[1], args.includeContext)
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b)), [])
          .filter(i => i[0] === 'token' && (!args.withChars || args.withChars.includes(i[2]))),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The text of the chapter as a single string',
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
