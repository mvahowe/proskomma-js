const {
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
} = require('graphql');

const {
  vrs2json,
  reverseVersification,
  succinctifyVerseMappings,
  mapVerse,
} = require('proskomma-utils');

const versificationMutations = {
  setVerseMapping: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      docSetId: { type: GraphQLNonNull(GraphQLString) },
      vrsSource: { type: GraphQLString },
      jsonSource: { type: GraphQLString },
    },
    resolve: (root, args) => {
      if (args.vrsSource && args.jsonSource) {
        throw new Error('Cannot specify both vrsSource and jsonSource');
      } else if (!args.vrsSource && !args.jsonSource) {
        throw new Error('Must specify either vrsSource or jsonSource');
      }

      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        return false;
      }

      let jsonSource;

      if (args.vrsSource) {
        jsonSource = vrs2json(args.vrsSource);
      } else {
        jsonSource = args.jsonSource;
      }

      const forwardSuccinctTree = succinctifyVerseMappings(
        jsonSource.mappedVerses,
      );

      const reversedJsonSource = reverseVersification(jsonSource);
      const reversedSuccinctTree = succinctifyVerseMappings(
        reversedJsonSource.reverseMappedVerses,
      );

      for (const document of docSet.documents().filter(doc => 'bookCode' in doc.headers)) {
        const bookCode = document.headers['bookCode'];
        const bookDocument = docSet.documentWithBook(bookCode);

        if (!bookDocument) {
          continue;
        }

        const bookMainSequence = bookDocument.sequences[bookDocument.mainId];
        bookMainSequence.verseMapping = {};

        if (bookCode in forwardSuccinctTree) {
          bookMainSequence.verseMapping.forward = forwardSuccinctTree[bookCode];
        }

        if (bookCode in reversedSuccinctTree) {
          bookMainSequence.verseMapping.reversed = reversedSuccinctTree[bookCode];
        }
      }
      docSet.tags.add('hasMapping');
      return true;
    },
  },
  unsetVerseMapping: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: { docSetId: { type: GraphQLNonNull(GraphQLString) } },
    resolve: (root, args) => {
      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        return false;
      }

      for (const document of docSet.documents().filter(doc => 'bookCode' in doc.headers)) {
        const bookCode = document.headers['bookCode'];
        const bookDocument = docSet.documentWithBook(bookCode);

        if (bookDocument) {
          const bookMainSequence = bookDocument.sequences[bookDocument.mainId];
          bookMainSequence.verseMapping = {};
        }
      }
      docSet.tags.delete('hasMapping');
      return true;
    },
  },
};

module.exports = versificationMutations;