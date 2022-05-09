const nv = (root, newVerseRange) => {
  const chapterN = parseInt(root[0]);
  const verseN = parseInt(root[1]);

  if (root[3].length <= verseN || root[3][verseN].length === 0) {
    return null;
  }
  let ret = null;
  let nc = chapterN;
  let nv = verseN;
  let index = root[3];
  let startVerseRange = index[verseN][0].verses;
  let onNextChapter = false;

  while (!ret) {
    nv += 1;

    if (nv >= index.length) {
      if (onNextChapter || !root[4]) {
        break;
      }
      nv = -1;
      nc += 1;
      index = root[4];
      onNextChapter = true;
    } else if (
      index[nv].length > 0 &&
      (!newVerseRange || onNextChapter || index[nv][0].verses !== startVerseRange)
    ) {
      ret = [nc, nv];
    }
  }
  return ret;
};

const pv = (root, newVerseRange) => {
  const chapterN = parseInt(root[0]);
  const verseN = parseInt(root[1]);

  if (root[3].length <= verseN || root[3][verseN].length === 0) {
    return null;
  }
  let ret = null;
  let nc = chapterN;
  let nv = verseN;
  let index = root[3];
  let startVerseRange = index[verseN][0].verses;
  let onPreviousChapter = false;

  while (!ret) {
    nv -= 1;
    if (nv < 0) {
      if (onPreviousChapter || !root[2]) {
        break;
      }
      nv = root[2].length;
      nc -= 1;
      index = root[2];
      onPreviousChapter = true;
    } else if (
      index[nv].length > 0 &&
      (!newVerseRange || onPreviousChapter || index[nv][0].verses !== startVerseRange)
    ) {
      ret = [nc, nv];
    }
  }
  return ret;
};

const cvNavigationSchemaString = `
"""Various answers to 'previous' and 'next' with respect to a verse"""
type cvNavigation {
  """The verse number for the next verse"""
  nextVerse: cv
  """The verse number for the previous verse"""
  previousVerse: cv
  """The verse number for the next verse range"""
  nextVerseRangeVerse: cv
  """The verse number for the previous verse range"""
  previousVerseRangeVerse: cv
  """The next chapter number (as a string)"""
  nextChapter: String
  """The previous chapter number (as a string)"""
  previousChapter: String
}
`;

// root is [ < 0 chapter >, < 1 verse >, < 2 previousChapterIndex >, < 3 thisChapterIndex >, < 4 nextChapterIndex > ]
const cvNavigationResolvers = {
  nextVerse: root => nv(root, false),
  previousVerse: root => pv(root, false),
  nextVerseRangeVerse: root => nv(root, true),
  previousVerseRangeVerse: root => pv(root, true),
  nextChapter: root => {
    if (root[3].length > 0 && root[4].length > 0) {
      return (parseInt(root[0]) + 1).toString();
    } else {
      return null;
    }
  },
  previousChapter: root => {
    if (root[2].length > 0 && root[3].length > 0) {
      return (parseInt(root[0]) - 1).toString();
    } else {
      return null;
    }
  },
};

export {
  cvNavigationSchemaString,
  cvNavigationResolvers,
};
