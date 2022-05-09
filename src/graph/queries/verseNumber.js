import { mapVerse } from 'proskomma-utils';

const verseNumberSchemaString = `
"""Information about a verse number (which may be part of a verse range)"""
type verseNumber {
  """The verse number"""
  number: Int!
  """The verse range to which the verse number belongs"""
  range: String!
  """The reference for this verse when mapped to 'original' versification"""
  orig: orig!
}
`;

const verseNumberResolvers = {
  orig: (root, args, context) => {
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
};

export {
  verseNumberSchemaString,
  verseNumberResolvers,
};
