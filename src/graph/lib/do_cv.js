const { mapVerse } = require('proskomma-utils');
const xre = require('xregexp');

const updatedOpenScopes = (openScopes, items) => {
  let ret = openScopes;

  for (const item of items) {
    if (item[0] === 'scope') {
      if (item[1] === 'start') {
        const existingScopes = ret.filter(s => s === item[2]);

        if (existingScopes.length === 0) {
          ret.push(item[2]);
        }
      } else {
        ret = ret.filter(s => s !== item[2]);
      }
    }
  }
  return ret;
};

const do_chapter_cv = (root, context, mainSequence, chapterN, includeContext) => {
  const ci = root.chapterIndex(chapterN);

  if (ci) {
    const block = mainSequence.blocks[ci.startBlock];
    return [[
      updatedOpenScopes(
        context.docSet.unsuccinctifyScopes(block.os).map(s => s[2]),
        context.docSet.unsuccinctifyItems(block.c, {}, 0, [])
          .slice(0, ci.startItem + 1)
          .filter(i => i[0] === 'scope'),
      ),
      context.docSet.itemsByIndex(mainSequence, ci, includeContext || false)
        .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))),
    ]];
  } else {
    return [];
  }
};

const do_chapter_verse_array = (root, context, mainSequence, chapterN, verses, includeContext, doMap, mappedDocSetId) => {
  let docSet = context.docSet;
  let book = root.headers.bookCode;
  let chapterVerses = verses.map(v => [parseInt(chapterN), parseInt(v)]);

  if (doMap) {
    const mappedDocSet = root.processor.docSets[mappedDocSetId];

    if (mappedDocSet) {
      docSet = mappedDocSet;
    }

    if ('forward' in mainSequence.verseMapping && chapterN in mainSequence.verseMapping.forward) {
      let mappings = [];

      for (const verse of verses) { // May handle multiple verses one day, but, eg, may map to multiple books
        mappings.push(
          mapVerse(
            mainSequence.verseMapping.forward[chapterN],
            root.headers.bookCode,
            chapterN,
            verse,
          ),
        );
      }

      const mapping = mappings[0];
      book = mapping[0];
      chapterVerses = mapping[1];
    }

    const mappedDocument = docSet.documentWithBook(book);

    if (mappedDocument) {
      const mappedMainSequence = mappedDocument.sequences[mappedDocument.mainId];

      if (mappedMainSequence.verseMapping && 'reversed' in mappedMainSequence.verseMapping) {
        const doubleMappings = [];

        for (const [origC, origV] of chapterVerses) {
          if (`${origC}` in mappedMainSequence.verseMapping.reversed) {
            doubleMappings.push(
              mapVerse(
                mappedMainSequence.verseMapping.reversed[`${origC}`],
                book,
                origC,
                origV,
              ),
            );
          } else {
            doubleMappings.push([book, [[origC, origV]]]);
          }
          book = doubleMappings[0][0];
          chapterVerses = doubleMappings.map(bcv => bcv[1]).reduce((a, b) => a.concat(b));
        }
      }
    }
  }

  const cvis = {};

  const document = docSet.documentWithBook(book);

  if (!document) {
    return [];
  }

  const documentMainSequence = document.sequences[document.mainId];

  for (const chapter of chapterVerses.map(cv => cv[0])) {
    if (!(chapter in cvis)) {
      cvis[chapter] = document.chapterVerseIndex(chapter);
    }
  }

  const retItemGroups = [];

  for (const [chapter, verse] of chapterVerses) {
    if (cvis[chapter]) {
      let retItems = [];
      let firstStartBlock;
      let firstStartItem;

      if (cvis[chapter][verse]) {
        for (const ve of cvis[chapter][verse]) {
          if (!firstStartBlock) {
            firstStartBlock = ve.startBlock;
            firstStartItem = ve.startItem;
          }
          retItems = retItems.concat(docSet.itemsByIndex(documentMainSequence, ve, includeContext || null)
            .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))));
        }

        const block = documentMainSequence.blocks[firstStartBlock];

        retItemGroups.push([
          updatedOpenScopes(
            docSet.unsuccinctifyScopes(block.os).map(s => s[2]),
            docSet.unsuccinctifyItems(block.c, {}, 0, [])
              .slice(0, firstStartItem + 1)
              .filter(i => i[0] === 'scope'),
          ),
          retItems,
        ]);
      }
    }
  }
  return retItemGroups;
};

const do_chapterVerses = (root, context, mainSequence, fromCV, toCV, includeContext) => {
  const [fromC, fromV] = fromCV.split(':');
  const [toC, toV] = toCV.split(':');
  const fromCVI = root.chapterVerseIndex(fromC);
  const toCVI = root.chapterVerseIndex(toC);

  if (!fromCVI || !toCVI || !fromCVI[parseInt(fromV)] || !toCVI[parseInt(toV)]) {
    return [];
  }

  const index = {
    startBlock: fromCVI[parseInt(fromV)][0].startBlock,
    endBlock: toCVI[parseInt(toV)][0].endBlock,
    startItem: fromCVI[parseInt(fromV)][0].startItem,
    endItem: toCVI[parseInt(toV)][0].endItem,
    nextToken: toCVI[parseInt(toV)][0].nextToken,
  };

  if (index.startBlock > index.endBlock || (index.startBlock === index.endBlock && index.startItem >= index.endItem)) {
    return [];
  }

  const block = mainSequence.blocks[index.startBlock];
  return [[
    updatedOpenScopes(
      context.docSet.unsuccinctifyScopes(block.os).map(s => s[2]),
      context.docSet.unsuccinctifyItems(block.c, {}, 0, [])
        .slice(0, index.startItem + 1)
        .filter(i => i[0] === 'scope'),
    ),
    context.docSet.itemsByIndex(mainSequence, index, includeContext || false)
      .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))),
  ]];
};

const do_cv_separate_args = (root, args, context, mainSequence, doMap, mappedDocSetId) => {
  if (args.chapter && !args.verses) { // whole chapter
    return do_chapter_cv(root, context, mainSequence, args.chapter, args.includeContext);
  } else if (args.verses) { // c:v, c:v-v one day, may be mapped
    return do_chapter_verse_array(root, context, mainSequence, args.chapter, args.verses, args.includeContext, doMap, mappedDocSetId);
  } else {
    throw new Error('Unexpected args to do_cv_separate_args');
  }
};

const do_cv_string_arg = (root, args, context, mainSequence) => {
  if (xre.test(args.chapterVerses, xre('^[0-9]+:[0-9]+-[0-9]+:[0-9]+$'))) { // c:v-c:v
    const [fromSpec, toSpec] = args.chapterVerses.split('-');
    return do_chapterVerses(root, context, mainSequence, fromSpec, toSpec, args.includeContext);
  } else if (xre.test(args.chapterVerses, xre('^[0-9]+:[0-9]+-[0-9]+$'))) { // c:v-v
    const [ch, vRange] = args.chapterVerses.split(':');
    const [fromV, toV] = vRange.split('-');
    return do_chapterVerses(root, context, mainSequence, `${ch}:${fromV}`, `${ch}:${toV}`, args.includeContext);
  } else if (xre.test(args.chapterVerses, xre('^[0-9]+:[0-9]+$'))) { // c:v
    const [ch, v] = args.chapterVerses.split(':');
    return do_chapterVerses(root, context, mainSequence, `${ch}:${v}`, `${ch}:${v}`, args.includeContext);
  } else {
    throw new Error(`Could not parse chapterVerses string '${args.chapterVerses}'`);
  }
};

const do_cv = (root, args, context, doMap, mappedDocSetId) => {
  context.docSet = root.processor.docSets[root.docSetId];
  const mainSequence = root.sequences[root.mainId];

  if (!args.chapter && !args.chapterVerses) {
    throw new Error('Must specify either chapter or chapterVerses for cv');
  }

  if (args.chapter && args.chapterVerses) {
    throw new Error('Must not specify both chapter and chapterVerses for cv');
  }

  if (args.chapterVerses && args.verses) {
    throw new Error('Must not specify both chapterVerses and verses for cv');
  }

  if (args.chapter) {
    return do_cv_separate_args(root, args, context, mainSequence, doMap, mappedDocSetId);
  } else {
    return do_cv_string_arg(root, args, context, mainSequence);
  }
};

module.exports = { do_cv };
