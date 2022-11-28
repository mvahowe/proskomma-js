import utils from '../../util';

const versificationMutationsSchemaString = `
  """Adds verse mapping tables to the documents in a docSet, where the verse mapping may be provided in legacy .vrs or JSON format"""
  setVerseMapping(
    """the id of the docSet to which the verse mapping will be added"""
    docSetId: String!
    """The verse mapping, in legacy .vrs format (as a string)"""
    vrsSource: String
    """The verse mapping, in JSON format (as a string)"""
    jsonSource: String
  ): Boolean!
  """Removes verse mapping tables from the documents in a docSet"""
  unsetVerseMapping(
    """The id of the docSet from which verse mapping will be removed"""
    docSetId: String!
  ): Boolean!
`;
const versificationMutationsResolvers = {
  setVerseMapping: (root, args) => {
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
      jsonSource = utils.versification.vrs2json(args.vrsSource);
    } else {
      jsonSource = args.jsonSource;
    }

    const forwardSuccinctTree = utils.versification.succinctifyVerseMappings(
      jsonSource.mappedVerses,
    );

    const reversedJsonSource = utils.versification.reverseVersification(jsonSource);
    const reversedSuccinctTree = utils.versification.succinctifyVerseMappings(
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
  unsetVerseMapping: (root, args) => {
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
};

export {
  versificationMutationsSchemaString,
  versificationMutationsResolvers,
};
