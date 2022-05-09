const remakeBlocks = (docSet, document, sequence, blocksSpec) => {
  const nBlocks = sequence.blocks.length;

  for (let blockN = 0; blockN < nBlocks; blockN++) {
    document.deleteBlock(sequence.id, 0, false);
  }

  for (let blockN = 0; blockN < blocksSpec.length; blockN++) {
    const block = blocksSpec[blockN];
    document.newBlock(sequence.id, blockN, block.bs.payload, null, false);
    const bgResult = docSet.updateBlockGrafts(
      document.id,
      sequence.id,
      blockN,
      block.bg,
    );

    if (!bgResult) {
      return false;
    }

    const osResult = docSet.updateOpenScopes(
      document.id,
      sequence.id,
      blockN,
      block.os,
    );

    if (!osResult) {
      return false;
    }

    const isResult = docSet.updateIncludedScopes(
      document.id,
      sequence.id,
      blockN,
      block.is,
    );

    if (!isResult) {
      return false;
    }

    const itemsResult = docSet.updateItems(
      document.id,
      sequence.id,
      blockN,
      block.items,
    );

    if (!itemsResult) {
      return false;
    }
  }
};

export { remakeBlocks };
