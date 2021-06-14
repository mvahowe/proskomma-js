const { mapVerse } = require('proskomma-utils');

const do_cv = (root, args, context, doMap, mappedDocSetId) => {
  const updatedOpenScopes = (openScopes, items) => {
    let ret = openScopes;

    for (const item of items) {
      if (item[0] === 'scope') {
        if (item[1] === 'start') {
          const existingScopes = ret.filter(s => s[2] === item[2]);

          if (existingScopes.length === 0) {
            ret.push(item[2]);
          }
        } else {
          ret = openScopes.filter(s => s[2] !== item[2]);
        }
      }
    }
    return ret;
  };

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

  if (args.chapter && !args.verses) { // whole chapter
    const ci = root.chapterIndex(args.chapter);

    if (ci) {
      const block = mainSequence.blocks[ci.startBlock];
      return [[
        updatedOpenScopes(
          context.docSet.unsuccinctifyScopes(block.os).map(s => s[2]),
          context.docSet.unsuccinctifyItems(block.c, { scopes: true }, 0, []).slice(0, ci.startItem),
        ),
        context.docSet.itemsByIndex(mainSequence, ci, args.includeContext || false)
          .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))),
      ]];
    } else {
      return [];
    }
  } else if (args.verses) { // c:v, c:v-v one day, may be mapped
    let docSet = context.docSet;
    let book = root.headers.bookCode;
    let chapterVerses = args.verses.map(v => [parseInt(args.chapter), parseInt(v)]);

    if (doMap) {
      const mappedDocSet = root.processor.docSets[mappedDocSetId];

      if (mappedDocSet) {
        docSet = mappedDocSet;
      }

      if ('forward' in mainSequence.verseMapping && args.chapter in mainSequence.verseMapping.forward) {
        let mappings = [];

        for (const verse of args.verses) { // May handle multiple verses one day, but, eg, may map to multiple books
          mappings.push(
            mapVerse(
              mainSequence.verseMapping.forward[args.chapter],
              root.headers.bookCode,
              args.chapter,
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
            retItems = retItems.concat(docSet.itemsByIndex(documentMainSequence, ve, args.includeContext || null)
              .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))));
          }

          const block = documentMainSequence.blocks[firstStartBlock];

          retItemGroups.push([
            updatedOpenScopes(
              docSet.unsuccinctifyScopes(block.os).map(s => s[2]),
              docSet.unsuccinctifyItems(block.c, { scopes: true }, 0, []).slice(0, firstStartItem),
            ),
            retItems,
          ]);
        }
      }
    }
    return retItemGroups;
  } else { // ChapterVerse, c:v-c:v
    const [fromCV, toCV] = args.chapterVerses.split('-');

    if (!toCV) {
      throw new Error(`chapterVerses must contain a dash ('${args.chapterVerses}')`);
    }

    const [fromC, fromV] = fromCV.split(':');

    if (!fromV) {
      throw new Error(`from cv of chapterVerses must contain a colon ('${args.chapterVerses}')`);
    }

    const [toC, toV] = toCV.split(':');

    if (!toV) {
      throw new Error(`to cv of chapterVerses must contain a colon ('${args.chapterVerses}')`);
    }

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
        context.docSet.unsuccinctifyItems(block.c, { scopes: true }, 0, []).slice(0, index.startItem),
      ),
      context.docSet.itemsByIndex(mainSequence, index, args.includeContext || false)
        .reduce((a, b) => a.concat([['token', 'lineSpace', ' ']].concat(b))),
    ]];
  }
};

module.exports = { do_cv };
