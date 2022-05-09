const cvIndexSchemaString = `
"""A chapterVerse index entry"""
type cvIndex {
  """The chapter number"""
  chapter: Int!
  """Information about the verses in the chapter"""
  verses: [cvVerses]
  """A list of verse number and range information, organized by verse number"""
  verseNumbers: [verseNumber!]
  """A list of verse number and range information, organized by verse range"""
  verseRanges: [verseRange!]
}
`;

const cvIndexResolvers = {
  chapter: root => root[0],
  verses: root => root[1],
  verseNumbers: (root, args, context) => {
    context.cvIndex = root;
    return [...root[1].entries()]
      .filter(v => v[1].length > 0)
      .map(v => ({
        number: v[0],
        range: v[1][v[1].length - 1].verses,
      }));
  },
  verseRanges: root => {
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
};

export {
  cvIndexSchemaString,
  cvIndexResolvers,
};
