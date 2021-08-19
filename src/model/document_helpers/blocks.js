const {
  ByteArray,
  headerBytes,
  itemEnum,
  nComponentsForScope,
  pushSuccinctGraftBytes,
  pushSuccinctScopeBytes,
  pushSuccinctTokenBytes,
  scopeEnum,
  scopeEnumLabels,
  tokenEnum,
} = require('proskomma-utils');

const { updateBlockGrafts } = require('../doc_set_helpers/update');

const deleteBlock = (document, seqId, blockN, buildCV) => {
  if (buildCV !== false) {
    buildCV = true;
  }

  if (!(seqId in document.sequences)) {
    return false;
  }

  const sequence = document.sequences[seqId];

  if (blockN < 0 || blockN >= sequence.blocks.length) {
    return false;
  }
  sequence.blocks.splice(blockN, 1);

  if (buildCV) {
    document.buildChapterVerseIndex(this);
  }
  return true;
};

const newBlock = (document, seqId, blockN, blockScope, blockGrafts, buildCV) => {
  if (buildCV !== false) {
    buildCV = true;
  }

  if (!(seqId in document.sequences)) {
    return false;
  }

  const sequence = document.sequences[seqId];

  if (blockN < 0 || blockN > sequence.blocks.length) {
    return false;
  }

  const docSet = document.processor.docSets[document.docSetId];
  docSet.maybeBuildPreEnums();

  const newBlock = {
    bs: new ByteArray(0),
    bg: new ByteArray(0),
    c: new ByteArray(0),
    os: new ByteArray(0),
    is: new ByteArray(0),
  };
  const scopeBits = blockScope.split('/');
  const scopeTypeByte = scopeEnum[scopeBits[0]];
  const expectedNScopeBits = nComponentsForScope(scopeBits[0]);

  if (scopeBits.length !== expectedNScopeBits) {
    throw new Error(`Scope ${blockScope} has ${scopeBits.length} component(s) (expected ${expectedNScopeBits}`);
  }

  const scopeBitBytes = scopeBits.slice(1).map(b => docSet.enumForCategoryValue('scopeBits', b, true));
  pushSuccinctScopeBytes(newBlock.bs, itemEnum[`startScope`], scopeTypeByte, scopeBitBytes);

  if (blockGrafts) {
    updateBlockGrafts(
      docSet,
      document.id,
      seqId,
      blockN,
      blockGrafts,
    );
  }
  sequence.blocks.splice(blockN, 0, newBlock);

  if (buildCV) {
    document.buildChapterVerseIndex(this);
  }
  return true;
};

const rewriteBlock = (block, oldToNew) => {
  for (const blockKey of ['bs', 'bg', 'c', 'is', 'os']) {
    const oldBa = block[blockKey];
    const newBa = new ByteArray(oldBa.length);
    let pos = 0;

    while (pos < oldBa.length) {
      const [itemLength, itemType, itemSubtype] = headerBytes(oldBa, pos);

      if (itemType === itemEnum['token']) {
        if (itemSubtype === tokenEnum.wordLike) {
          pushSuccinctTokenBytes(newBa, itemSubtype, oldToNew.wordLike[oldBa.nByte(pos + 2)]);
        } else {
          pushSuccinctTokenBytes(newBa, itemSubtype, oldToNew.notWordLike[oldBa.nByte(pos + 2)]);
        }
      } else if (itemType === itemEnum['graft']) {
        pushSuccinctGraftBytes(newBa, oldToNew.graftTypes[itemSubtype], oldToNew.ids[oldBa.nByte(pos + 2)]);
      } else {
        let nScopeBitBytes = nComponentsForScope(scopeEnumLabels[itemSubtype]);
        const scopeBitBytes = [];
        let offset = 2;

        while (nScopeBitBytes > 1) {
          const scopeBitByte = oldToNew.scopeBits[oldBa.nByte(pos + offset)];
          scopeBitBytes.push(scopeBitByte);
          offset += oldBa.nByteLength(scopeBitByte);
          nScopeBitBytes--;
        }
        pushSuccinctScopeBytes(newBa, itemType, itemSubtype, scopeBitBytes);
      }
      pos += itemLength;
    }
    newBa.trim();
    block[blockKey] = newBa;
  }
};

module.exports = {
  newBlock,
  deleteBlock,
  rewriteBlock,
};
