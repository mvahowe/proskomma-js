import xre from 'xregexp';

const blocksWithScriptureCV = (docSet, blocks, cv) => {
  const hasMiddleChapter = (b, fromC, toC) => {
    const blockChapterScopes = [
      ...docSet.unsuccinctifyScopes(b.os).map(s => s[2]),
      ...docSet.unsuccinctifyScopes(b.is).map(s => s[2]),
    ].filter(s => s.startsWith('chapter/'));
    return blockChapterScopes.map(s => parseInt(s.split('/')[1])).filter(n => n > fromC && n < toC).length > 0;
  };

  const hasFirstChapter = (b, fromC, fromV) => {
    const hasFirstChapterScope = [
      ...docSet.unsuccinctifyScopes(b.os).map(s => s[2]),
      ...docSet.unsuccinctifyScopes(b.is).map(s => s[2]),
    ].includes(`chapter/${fromC}`);
    return hasFirstChapterScope &&
      docSet.blockHasMatchingItem(
        b,
        (item, openScopes) => {
          if (!openScopes.has(`chapter/${fromC}`)) {
            return false;
          }
          return (
            Array.from(openScopes)
              .filter(s => s.startsWith('verse/'))
              .filter(s => parseInt(s.split('/')[1]) >= fromV).length
            > 0
            ||
            (
              fromV === 0 &&
              item[0] === 'token' &&
              item[2] &&
              Array.from(openScopes)
                .filter(s => s.startsWith('verse'))
                .length === 0
            )
          );
        },
        {},
      );
  };

  const hasLastChapter = (b, toC, toV) => {
    const hasLastChapterScope = [
      ...docSet.unsuccinctifyScopes(b.os).map(s => s[2]),
      ...docSet.unsuccinctifyScopes(b.is).map(s => s[2]),
    ].includes(`chapter/${toC}`);
    return hasLastChapterScope &&
      docSet.blockHasMatchingItem(
        b,
        (item, openScopes) => {
          if (!openScopes.has(`chapter/${toC}`)) {
            return false;
          }
          return (
            Array.from(openScopes)
              .filter(s => s.startsWith('verse/'))
              .filter(s => parseInt(s.split('/')[1]) <= toV).length
            > 0
            ||
            (
              toV === 0 &&
              item[0] === 'token' &&
              item[2] &&
              Array.from(openScopes)
                .filter(s => s.startsWith('verse'))
                .length === 0
            )

          );
        },
        {},
      );
  };

  if (xre.exec(cv, xre('^[1-9][0-9]*$'))) {
    const scopes = [`chapter/${cv}`];
    return blocks.filter(b => docSet.allScopesInBlock(b, scopes));
  } else if (xre.exec(cv, xre('^[1-9][0-9]*-[1-9][0-9]*$'))) {
    const [fromC, toC] = cv.split('-').map(v => parseInt(v));

    if (fromC > toC) {
      throw new Error(`Chapter range must be from min to max, not '${cv}'`);
    }

    const scopes = [...Array((toC - fromC) + 1).keys()].map(n => `chapter/${n + fromC}`);
    return blocks.filter(b => docSet.anyScopeInBlock(b, scopes));
  } else if (xre.exec(cv, xre('^[1-9][0-9]*:[0-9]+$'))) {
    const [fromC, fromV] = cv.split(':').map(v => parseInt(v));

    if (fromV === 0) {
      const scopes = [`chapter/${fromC}`];
      return blocks
        .filter(b => docSet.allScopesInBlock(b, scopes))
        .filter(
          b =>
            [...docSet.allBlockScopes(b)]
              .filter(s => s.startsWith('verse')).length === 0,
        );
    } else {
      const scopes = [`chapter/${fromC}`, `verse/${fromV}`];
      return blocks.filter(b => docSet.allScopesInBlock(b, scopes));
    }
  } else if (xre.exec(cv, xre('^[1-9][0-9]*:[0-9]+-[1-9][0-9]*$'))) {
    const [fromC, vs] = cv.split(':');
    const [fromV, toV] = vs.split('-').map(v => parseInt(v));

    if (fromV > toV) {
      throw new Error(`Verse range must be from min to max, not '${vs}'`);
    }

    const chapterScopes = [`chapter/${fromC}`];
    const verseScopes = [...Array((toV - fromV) + 1).keys()].map(n => `verse/${n + fromV}`);
    return blocks
      .filter(b => docSet.allScopesInBlock(b, chapterScopes))
      .filter(
        b =>
          docSet.anyScopeInBlock(b, verseScopes) ||
          (
            fromV === 0 &&
            [...docSet.allBlockScopes(b)]
              .filter(s => s.startsWith('verse')).length === 0
          ),
      );
  } else if (xre.exec(cv, xre('^[1-9][0-9]*:[0-9]+-[1-9][0-9]*:[0-9]+$'))) {
    const [fromCV, toCV] = cv.split('-');
    const [fromC, fromV] = fromCV.split(':').map(c => parseInt(c));
    const [toC, toV] = toCV.split(':').map(v => parseInt(v));

    if (fromC > toC) {
      throw new Error(`Chapter range must be from min to max, not '${fromC}-${toV}'`);
    }

    const chapterScopes = [...Array((toC - fromC) + 1).keys()].map(n => `chapter/${n + fromC}`);
    const chapterBlocks = blocks.filter(b => docSet.anyScopeInBlock(b, chapterScopes));
    return chapterBlocks.filter(b => hasMiddleChapter(b, fromC, toC) || hasFirstChapter(b, fromC, fromV) || hasLastChapter(b, toC, toV));
  } else {
    throw new Error(`Bad cv reference '${cv}'`);
  }
};

module.exports = { blocksWithScriptureCV };
