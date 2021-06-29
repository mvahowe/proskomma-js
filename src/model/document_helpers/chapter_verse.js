const BitSet = require('bitset');

const {
  ByteArray,
  headerBytes,
  itemEnum,
  tokenEnum,
} = require('proskomma-utils');

const emptyCVIndexType = 0;
const shortCVIndexType = 2;
const longCVIndexType = 3;

const buildChapterVerseIndex = document => {
  const mainSequence = document.sequences[document.mainId];
  const docSet = document.processor.docSets[document.docSetId];
  docSet.buildPreEnums();
  docSet.buildEnumIndexes();
  const chapterVerseIndexes = {};
  const chapterIndexes = {};
  let chapterN = '0';
  let verseN = '0';
  let verses = '1';
  let nextTokenN = 0;

  mainSequence.chapterVerses = {};

  if (docSet.enums.wordLike.length === 0) {
    throw new Error('No wordLike content in docSet - probably a USFM issue, maybe missing \\mt?');
  }
  mainSequence.tokensPresent = new BitSet(
    new Array(docSet.enums.wordLike.length)
      .fill(0)
      .map(b => b.toString())
      .join(''),
  );

  for (const [blockN, block] of mainSequence.blocks.entries()) {
    let pos = 0;
    let succinct = block.c;
    let itemN = -1;

    while (pos < succinct.length) {
      itemN++;
      const [itemLength, itemType, itemSubtype] = headerBytes(succinct, pos);

      if (itemType === itemEnum['startScope']) {
        let scopeLabel = docSet.succinctScopeLabel(succinct, itemSubtype, pos);

        if (scopeLabel.startsWith('chapter/')) {
          chapterN = scopeLabel.split('/')[1];
          chapterVerseIndexes[chapterN] = {};
          chapterIndexes[chapterN] = {
            startBlock: blockN,
            startItem: itemN,
            nextToken: nextTokenN,
          };
        } else if (scopeLabel.startsWith('verse/')) {
          verseN = scopeLabel.split('/')[1];

          if (verseN === '1' && !('0' in chapterVerseIndexes[chapterN])) {
            if (chapterIndexes[chapterN].nextToken < nextTokenN) {
              chapterVerseIndexes[chapterN]['0'] = [{
                startBlock: chapterIndexes[chapterN].startBlock,
                startItem: chapterIndexes[chapterN].startItem,
                endBlock: blockN,
                endItem: Math.max(itemN - 1, 0),
                nextToken: chapterIndexes[chapterN].nextToken,
                verses: '0',
              }];
            }
          }

          if (!(verseN in chapterVerseIndexes[chapterN])) {
            chapterVerseIndexes[chapterN][verseN] = [];
          }
          chapterVerseIndexes[chapterN][verseN].push({
            startBlock: blockN,
            startItem: itemN,
            nextToken: nextTokenN,
          });
        } else if (scopeLabel.startsWith('verses/')) {
          verses = scopeLabel.split('/')[1];
        }
      } else if (itemType === itemEnum['endScope']) {
        let scopeLabel = docSet.succinctScopeLabel(succinct, itemSubtype, pos);

        if (scopeLabel.startsWith('chapter/')) {
          chapterN = scopeLabel.split('/')[1];
          let chapterRecord = chapterIndexes[chapterN];

          if (chapterRecord) { // Check start chapter has not been deleted
            chapterRecord.endBlock = blockN;
            chapterRecord.endItem = itemN;
          }
        } else if (scopeLabel.startsWith('verse/')) {
          verseN = scopeLabel.split('/')[1];
          let versesRecord = chapterVerseIndexes[chapterN][verseN];

          if (versesRecord) { // Check start verse has not been deleted
            const verseRecord = chapterVerseIndexes[chapterN][verseN][chapterVerseIndexes[chapterN][verseN].length - 1];
            verseRecord.endBlock = blockN;
            verseRecord.endItem = itemN;
            verseRecord.verses = verses;
          }
        }
      } else if (itemType === itemEnum['token'] && itemSubtype === tokenEnum['wordLike']) {
        mainSequence.tokensPresent
          .set(
            succinct.nByte(pos + 2),
            1,
          );
        nextTokenN++;
      }
      pos += itemLength;
    }
  }

  for (const [chapterN, chapterVerses] of Object.entries(chapterVerseIndexes)) {
    const ba = new ByteArray();
    mainSequence.chapterVerses[chapterN] = ba;
    const sortedVerses = Object.keys(chapterVerses)
      .map(n => parseInt(n))
      .sort((a, b) => a - b);

    if (sortedVerses.length === 0) {
      continue;
    }

    const maxVerse = sortedVerses[sortedVerses.length - 1];
    const verseSlots = Array.from(Array(maxVerse + 1).keys());
    let pos = 0;

    for (const verseSlot of verseSlots) {
      const verseKey = `${verseSlot}`;

      if (verseKey in chapterVerses) {
        const verseElements = chapterVerses[verseKey];
        const nVerseElements = verseElements.length;

        for (const [verseElementN, verseElement] of verseElements.entries()) {
          const versesEnumIndex = docSet.enumForCategoryValue('scopeBits', verseElement.verses);
          const recordType = verseElement.startBlock === verseElement.endBlock ? shortCVIndexType : longCVIndexType;
          ba.pushByte(0);

          if (recordType === shortCVIndexType) {
            ba.pushNBytes([
              verseElement.startBlock,
              verseElement.startItem,
              verseElement.endItem,
              verseElement.nextToken,
              versesEnumIndex,
            ]);
          } else {
            ba.pushNBytes([
              verseElement.startBlock,
              verseElement.endBlock,
              verseElement.startItem,
              verseElement.endItem,
              verseElement.nextToken,
              versesEnumIndex,
            ]);
          }
          ba.setByte(pos, makeVerseLengthByte(recordType, verseElementN === (nVerseElements - 1), ba.length - pos));
          pos = ba.length;
        }
      } else {
        ba.pushByte(makeVerseLengthByte(emptyCVIndexType, true, 1));
        pos++;
      }
    }
    ba.trim();
  }
  mainSequence.chapters = {};

  for (const [chapterN, chapterElement] of Object.entries(chapterIndexes)) {
    if (!('startBlock' in chapterElement) || !('endBlock' in chapterElement)) {
      continue;
    }

    const ba = new ByteArray();
    mainSequence.chapters[chapterN] = ba;
    const recordType = chapterElement.startBlock === chapterElement.endBlock ? shortCVIndexType : longCVIndexType;
    ba.pushByte(0);

    if (recordType === shortCVIndexType) {
      ba.pushNBytes([chapterElement.startBlock, chapterElement.startItem, chapterElement.endItem, chapterElement.nextToken]);
    } else {
      ba.pushNBytes([chapterElement.startBlock, chapterElement.endBlock, chapterElement.startItem, chapterElement.endItem, chapterElement.nextToken]);
    }
    ba.setByte(0, makeVerseLengthByte(recordType, true, ba.length));
    ba.trim();
  }
};

const chapterVerseIndex = (document, chapN) => {
  const docSet = document.processor.docSets[document.docSetId];
  docSet.buildEnumIndexes();
  const ret = [];
  const succinct = document.sequences[document.mainId].chapterVerses[chapN];

  if (succinct) {
    let pos = 0;
    let currentVerseRecord = [];

    while (pos < succinct.length) {
      const [recordType, isLast, recordLength] = verseLengthByte(succinct, pos);

      if (recordType === shortCVIndexType) {
        const nBytes = succinct.nBytes(pos + 1, 5);

        currentVerseRecord.push({
          startBlock: nBytes[0],
          endBlock: nBytes[0],
          startItem: nBytes[1],
          endItem: nBytes[2],
          nextToken: nBytes[3],
          verses: docSet.enums.scopeBits.countedString(docSet.enumIndexes.scopeBits[nBytes[4]]),
        });
      } else if (recordType === longCVIndexType) {
        const nBytes = succinct.nBytes(pos + 1, 6);

        currentVerseRecord.push({
          startBlock: nBytes[0],
          endBlock: nBytes[1],
          startItem: nBytes[2],
          endItem: nBytes[3],
          nextToken: nBytes[4],
          verses: docSet.enums.scopeBits.countedString(docSet.enumIndexes.scopeBits[nBytes[5]]),
        });
      }

      if (isLast) {
        ret.push(currentVerseRecord);
        currentVerseRecord = [];
      }
      pos += recordLength;
    }
  }
  return ret;
};

const chapterIndex = (document, chapN) => {
  const succinct = document.sequences[document.mainId].chapters[chapN];

  if (succinct) {
    const recordType = verseLengthByte(succinct, 0)[0];

    if (recordType === shortCVIndexType) {
      const nBytes = succinct.nBytes(1, 4);

      return {
        startBlock: nBytes[0],
        endBlock: nBytes[0],
        startItem: nBytes[1],
        endItem: nBytes[2],
        nextToken: nBytes[3],
      };
    } else if (recordType === longCVIndexType) {
      const nBytes = succinct.nBytes(1, 5);

      return {
        startBlock: nBytes[0],
        endBlock: nBytes[1],
        startItem: nBytes[2],
        endItem: nBytes[3],
        nextToken: nBytes[4],
      };
    }
  }
};

const makeVerseLengthByte = (recordType, isLast, length) => length + (isLast ? 32 : 0) + (recordType * 64);

const verseLengthByte= (succinct, pos) => {
  const sByte = succinct.byte(pos);
  return [
    sByte >> 6,
    (sByte >> 5) % 2 === 1,
    sByte % 32,
  ];
};

module.exports = {
  buildChapterVerseIndex,
  chapterVerseIndex,
  chapterIndex,
};