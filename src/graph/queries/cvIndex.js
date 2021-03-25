const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const itemType = require('./item');

const cvVerseElementType = new GraphQLObjectType({
  name: 'cvVerseElement',
  fields: () => ({
    startBlock: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.startBlock,
    },
    endBlock: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.endBlock,
    },
    startItem: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.startItem,
    },
    endItem: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.endItem,
    },
    nextToken: {
      type: GraphQLInt,
      resolve: root => root.nextToken,
    },
    verseRange: {
      type: GraphQLString,
      resolve: root => root.verses,
    },
    items: {
      type: GraphQLNonNull(GraphQLList(itemType)),
      args: { includeContext: { type: GraphQLBoolean } },
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root, args.includeContext)
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b))),
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(itemType)),
      args: {
        includeContext: { type: GraphQLBoolean },
        withChars: { type: GraphQLList(GraphQLNonNull(GraphQLString)) },
      },
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root, args.includeContext)
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b)))
          .filter(i => i[0] === 'token' && (!args.withChars || args.withChars.includes(i[2]))),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root)
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b)))
          .filter(i => i[0] === 'token')
          .map(t => t[1] === 'lineSpace' ? ' ' : t[2])
          .join('')
          .trim(),
    },
  }),
});

const cvVersesType = new GraphQLObjectType({
  name: 'cvVerses',
  fields: () => ({
    verse: {
      type: GraphQLList(cvVerseElementType),
      resolve: root => root,
    },
  }),
});

const orig = new GraphQLObjectType({
  name: 'orig',
  fields: () => ({
    book: {
      type: GraphQLString,
      resolve: () => {
        throw new Error('Not implemented');
      },
    },
    chapter: {
      type: GraphQLInt,
      resolve: () => {
        throw new Error('Not implemented');
      },
    },
    verses: {
      type: GraphQLList(GraphQLNonNull(GraphQLInt)),
      resolve: () => {
        throw new Error('Not implemented');
      },
    },
  }),
});

const verseNumber = new GraphQLObjectType({
  name: 'verseNumber',
  fields: () => ({
    number: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.number,
    },
    range: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root.range,
    },
    orig: {
      type: GraphQLNonNull(orig),
      resolve: () => {
        throw new Error('Not implemented');
      },
    },
  }),
});

const verseRange = new GraphQLObjectType({
  name: 'verseRange',
  fields: () => ({
    range: {
      type: GraphQLNonNull(GraphQLString),
      resolve: root => root.range,
    },
    numbers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt))),
      resolve: root => root.numbers,
    },
  }),
});

const cvIndexType = new GraphQLObjectType({
  name: 'cvIndex',
  fields: () => ({
    chapter: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root[0],
    },
    verses: {
      type: GraphQLList(cvVersesType),
      resolve: root => root[1],
    },
    verseNumbers: {
      type: GraphQLList(GraphQLNonNull(verseNumber)),
      resolve: root => [...root[1].entries()].filter(v => v[1].length > 0).map(v => ({ number: v[0], range: v[1][v[1].length - 1].verses })),
    },
    verseRanges: {
      type: GraphQLList(GraphQLNonNull(verseRange)),
      resolve: root => {
        const ret = [];

        for (const [vn, vo] of [...root[1].entries()].filter(v => v[1].length > 0)) {
          if (ret.length === 0 || ret[ret.length - 1].range !== vo[vo.length - 1].verses) {
            ret.push({ range: vo[vo.length - 1].verses, numbers: [vn] });
          } else {
            ret[ret.length - 1].numbers.push(vn);
          }
        }
        return ret;
      },
    },
  }),
});

module.exports = cvIndexType;
