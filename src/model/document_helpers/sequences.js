import deepCopy from 'deep-copy-all';

import utils from "../../util";

const gcSequences = document => {
  const usedSequences = new Set();
  const docSet = document.processor.docSets[document.docSetId];
  docSet.maybeBuildEnumIndexes();

  const followGrafts = (document, sequence, used) => {
    used.add(sequence.id);

    for (const block of sequence.blocks) {
      for (const blockGraft of docSet.unsuccinctifyGrafts(block.bg)) {
        if (!used.has(blockGraft[2])) {
          followGrafts(document, document.sequences[blockGraft[2]], used);
        }
      }

      for (const inlineGraft of docSet.unsuccinctifyItems(block.c, { grafts: true }, 0)) {
        if (!used.has(inlineGraft[2])) {
          followGrafts(document, document.sequences[inlineGraft[2]], used);
        }
      }
    }
  };

  followGrafts(document, document.sequences[document.mainId], usedSequences);
  let changed = false;

  for (const sequenceId of Object.keys(document.sequences)) {
    if (!usedSequences.has(sequenceId)) {
      delete document.sequences[sequenceId];
      changed = true;
    }
  }

  return changed;
};

const newSequence = (document, seqType, tags) => {
  const seqId = utils.generateId();

  document.sequences[seqId] = {
    id: seqId,
    type: seqType,
    tags: new Set(tags || []),
    isBaseType: (seqType in document.baseSequenceTypes),
    blocks: [],
  };

  return seqId;
};

const deleteSequence = (document, seqId) => {
  if (!(seqId in document.sequences)) {
    return false;
  }

  if (document.sequences[seqId].type === 'main') {
    throw new Error('Cannot delete main sequence');
  }

  if (document.sequences[seqId].type in document.baseSequenceTypes) {
    gcSequenceReferences(document,'block', seqId);
  } else {
    gcSequenceReferences(document,'inline', seqId);
  }
  delete document.sequences[seqId];
  document.buildChapterVerseIndex(this);
  document.gcSequences();
  return true;
};

const gcSequenceReferences = (document, seqContext, seqId) => {
  const docSet = document.processor.docSets[document.docSetId];

  for (const sequence of Object.values(document.sequences)) {
    for (const block of sequence.blocks) {
      const succinct = seqContext === 'block' ? block.bg : block.c;
      let pos = 0;

      while (pos < succinct.length) {
        const [itemLength, itemType] = utils.succinct.headerBytes(succinct, pos);

        if (itemType !== utils.itemDefs.itemEnum.graft) {
          pos += itemLength;
        } else {
          const graftSeqId = utils.succinct.succinctGraftSeqId(docSet.enums, docSet.enumIndexes, succinct, pos);

          if (graftSeqId === seqId) {
            succinct.deleteItem(pos);
          } else {
            pos += itemLength;
          }
        }
      }
    }
  }
};

const modifySequence = (
  document,
  seqId,
  sequenceRewriteFunc,
  blockFilterFunc,
  itemFilterFunc,
  blockRewriteFunc,
  itemRewriteFunc,
) => {
  const docSet = document.processor.docSets[document.docSetId];
  docSet.maybeBuildEnumIndexes();
  sequenceRewriteFunc = sequenceRewriteFunc || (s => s);
  const oldSequence = document.sequences[seqId];
  const newSequence = sequenceRewriteFunc({
    id: seqId,
    type: oldSequence.type,
    tags: oldSequence.tags,
    isBaseType: oldSequence.isBaseType,
    verseMapping: oldSequence.verseMapping,
  });

  pushModifiedBlocks(
    oldSequence,
    newSequence,
    blockFilterFunc,
    itemFilterFunc,
    blockRewriteFunc,
    itemRewriteFunc,
  );
  document.sequences[seqId] = newSequence;

  if (newSequence.type === 'main') {
    document.buildChapterVerseIndex();
  }
  return newSequence;
};

const pushModifiedBlocks = (
  oldSequence,
  newSequence,
  blockFilterFunc,
  itemFilterFunc,
  blockRewriteFunc,
  itemRewriteFunc,
) => {
  blockFilterFunc = blockFilterFunc || ((oldSequence, blockN, block) => !!block);
  itemFilterFunc = itemFilterFunc ||
    ((oldSequence, oldBlockN, block, itemN, itemType, itemSubType, pos) => !!block || pos);
  blockRewriteFunc = blockRewriteFunc || ((oldSequence, blockN, block) => block);
  itemRewriteFunc = itemRewriteFunc ||
    (
      (oldSequence, oldBlockN, oldBlock, newBlock, itemN, itemLength, itemType, itemSubType, pos) => {
        for (let n = 0; n < itemLength; n++) {
          newBlock.c.pushByte(oldBlock.c.byte(pos + n));
        }
      }
    );
  newSequence.blocks = [];

  for (const [blockN, block] of oldSequence.blocks.entries()) {
    if (blockFilterFunc(oldSequence, blockN, block)) {
      const newBlock = blockRewriteFunc(oldSequence, blockN, deepCopy(block));
      newBlock.c.clear();
      modifyBlockItems(
        oldSequence,
        blockN,
        block,
        newBlock,
        itemFilterFunc,
        itemRewriteFunc,
      );
      newSequence.blocks.push(newBlock);
    }
  }
};

const modifyBlockItems = (
  oldSequence,
  oldBlockN,
  oldBlock,
  newBlock,
  itemFilterFunc,
  itemRewriteFunc,
) => {
  let pos = 0;
  let itemN = -1;

  while (pos < oldBlock.c.length) {
    itemN++;
    const [itemLength, itemType, itemSubtype] = utils.succinct.headerBytes(oldBlock.c, pos);

    if (itemFilterFunc(oldSequence, oldBlockN, oldBlock, itemN, itemType, itemSubtype, pos)) {
      itemRewriteFunc(oldSequence, oldBlockN, oldBlock, newBlock, itemN, itemLength, itemType, itemSubtype, pos);
    }
    pos += itemLength;
  }
};

export {
  newSequence,
  gcSequences,
  deleteSequence,
  modifySequence,
};
