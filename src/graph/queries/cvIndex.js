const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const { mapVerse } = require('proskomma-utils');

const itemType = require('./item');

const cvVerseElementType = new GraphQLObjectType({
  name: 'cvVerseElement',
  description: 'Information about a verse element',
  fields: () => ({
    startBlock: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The zero-indexed number of the block where the verse starts',
      resolve: root => root.startBlock,
    },
    endBlock: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The zero-indexed number of the block where the verse ends',
      resolve: root => root.endBlock,
    },
    startItem: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The zero-indexed position of the item where the verse starts',
      resolve: root => root.startItem,
    },
    endItem: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The zero-indexed position of the item where the verse ends',
      resolve: root => root.endItem,
    },
    nextToken: {
      type: GraphQLInt,
      description: 'The value of nextToken at the beginning of the verse',
      resolve: root => root.nextToken,
    },
    verseRange: {
      type: GraphQLString,
      description: 'The verse range for this verse as it would be printed in a Bible',
      resolve: root => root.verses,
    },
    items: {
      type: GraphQLNonNull(GraphQLList(itemType)),
      description: 'A list of items for this verse',
      args: {
        includeContext: {
          type: GraphQLBoolean,
          description: 'If true, adds scope and nextToken information to each item',
        },
      },
      resolve: (root, args, context) =>
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root, args.includeContext)
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b))),
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(itemType)),
      description: 'A list of tokens for this verse',
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
        context.docSet.itemsByIndex(context.doc.sequences[context.doc.mainId], root, args.includeContext)
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ', null]].concat(b)))
          .filter(i => i[0] === 'token' && (!args.withChars || args.withChars.includes(i[2]))),
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The text of the verse as a single string',
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
  description: 'Information about a verse in the chapter',
  fields: () => ({
    verse: {
      type: GraphQLList(cvVerseElementType),
      resolve: root => root,
    },
  }),
});

const cvType = new GraphQLObjectType({
  name: 'cv',
  description: 'A chapter-verse reference',
  fields: () => ({
    chapter: {
      type: GraphQLInt,
      description: 'The chapter number',
      resolve: root => root[0],
    },
    verse: {
      type: GraphQLInt,
      description: 'The verse number',
      resolve: root => root[1],
    },
  }),
});

const orig = new GraphQLObjectType({
  name: 'orig',
  description: 'Mapped verse information',
  fields: () => ({
    book: {
      type: GraphQLString,
      description: 'The book code',
      resolve: root => root.book,
    },
    cvs: {
      type: GraphQLNonNull(GraphQLList(cvType)),
      description: 'A list of chapter-verse references',
      resolve: root => root.cvs,
    },
  }),
});

const verseNumber = new GraphQLObjectType({
  name: 'verseNumber',
  description: 'Information about a verse number (which may be part of a verse range)',
  fields: () => ({
    number: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The verse number',
      resolve: root => root.number,
    },
    range: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The verse range to which the verse number belongs',
      resolve: root => root.range,
    },
    orig: {
      type: GraphQLNonNull(orig),
      description: 'The reference for this verse when mapped to \'original\' versification',
      resolve: (root, args, context) => {
        const localBook = context.doc.headers.bookCode;
        const localChapter = context.cvIndex[0];
        const localVerse = root.number;
        const mainSequence = context.doc.sequences[context.doc.mainId];

        if (
          mainSequence.verseMapping &&
          'forward' in mainSequence.verseMapping &&
          `${localChapter}` in mainSequence.verseMapping.forward
        ) {
          const mapping = mapVerse(mainSequence.verseMapping.forward[`${localChapter}`], localBook, localChapter, localVerse);
          return ({
            book: mapping[0],
            cvs: mapping[1],
          });
        } else {
          return ({
            book: localBook,
            cvs: [[localChapter, localVerse]],
          });
        }
      },
    },
  }),
});

const verseRange = new GraphQLObjectType({
  name: 'verseRange',
  description: 'Information about a verse range (which may only cover one verse)',
  fields: () => ({
    range: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The range, as it would be printed in a Bible',
      resolve: root => root.range,
    },
    numbers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt))),
      description: 'A list of verse numbers for this range',
      resolve: root => root.numbers,
    },
  }),
});

const cvIndexType = new GraphQLObjectType({
  name: 'cvIndex',
  description: 'A chapterVerse index entry',
  fields: () => ({
    chapter: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The chapter number',
      resolve: root => root[0],
    },
    verses: {
      type: GraphQLList(cvVersesType),
      description: 'Information about the verses in the chapter',
      resolve: root => root[1],
    },
    verseNumbers: {
      type: GraphQLList(GraphQLNonNull(verseNumber)),
      description: 'A list of verse number and range information, organized by verse number',
      resolve: (root, args, context) => {
        context.cvIndex = root;
        return [...root[1].entries()]
          .filter(v => v[1].length > 0)
          .map(v => ({
            number: v[0],
            range: v[1][v[1].length - 1].verses,
          }));
      },
    },
    verseRanges: {
      type: GraphQLList(GraphQLNonNull(verseRange)),
      description: 'A list of verse number and range information, organized by verse range',
      resolve: root => {
        const ret = [];

        for (const [vn, vo] of [...root[1].entries()].filter(v => v[1].length > 0)) {
          if (ret.length === 0 || ret[ret.length - 1].range !== vo[vo.length - 1].verses) {
            ret.push({
              range: vo[vo.length - 1].verses,
              numbers: [vn],
            });
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
