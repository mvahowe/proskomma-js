const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const { mapVerse } = require('proskomma-utils');

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


const verseNumberType = new GraphQLObjectType({
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

module.exports = verseNumberType;
