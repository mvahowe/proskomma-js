import {
  ByteArray,
  headerBytes,
  itemEnum,
} from 'proskomma-utils';


const succinctFilter = (document, filterOptions) => {
  if (!filterOptions || Object.keys(filterOptions).length === 0) {
    return;
  }

  const docSet = document.processor.docSets[document.docSetId];

  const filterItem = (oldSequence, oldBlockN, block, itemN, itemType, itemSubType, pos) => {
    if (itemType === itemEnum.token) {
      return true;
    } else if (itemType === itemEnum.startScope || itemType === itemEnum.endScope) {
      if (!filterOptions.includeScopes && !filterOptions.excludeScopes) {
        return true;
      } else {
        const scopeOb = docSet.unsuccinctifyScope(block.c, itemType, itemSubType, pos);
        return (
          (
            !filterOptions.includeScopes ||
          filterOptions.includeScopes.filter(op => scopeOb[2].startsWith(op)).length > 0
          )
        &&
        (
          !filterOptions.excludeScopes ||
          filterOptions.excludeScopes.filter(op => scopeOb[2].startsWith(op)).length === 0
        )
        );
      }
    } else { // graft
      if (!filterOptions.includeGrafts && !filterOptions.excludeGrafts) {
        return true;
      }

      const graftOb = docSet.unsuccinctifyGraft(block.c, itemSubType, pos);
      return (
        (
          !filterOptions.includeGrafts ||
        filterOptions.includeGrafts.filter(op => graftOb[1].startsWith(op)).length > 0
        )
      &&
      (
        !filterOptions.excludeGrafts ||
        filterOptions.excludeGrafts.filter(op => graftOb[1].startsWith(op)).length === 0
      )
      );
    }
  };

  const rewriteBlock = (oldSequence, blockN, block) => {
    const newBA = new ByteArray(block.bg.length);
    let pos = 0;

    while (pos < block.bg.length) {
      const [itemLength, itemType, itemSubtype] = headerBytes(block.bg, pos);
      const graftOb = docSet.unsuccinctifyGraft(block.bg, itemSubtype, pos);

      if (
        (
          !filterOptions.includeGrafts ||
        filterOptions.includeGrafts.filter(op => graftOb[1].startsWith(op)).length > 0
        )
      &&
      (
        !filterOptions.excludeGrafts ||
        filterOptions.excludeGrafts.filter(op => graftOb[1].startsWith(op)).length === 0
      )
      ) {
        for (let n = 0; n < itemLength; n++) {
          newBA.pushByte(block.bg.byte(pos + n));
        }
      }
      pos += itemLength;
    }
    newBA.trim();
    block.bg = newBA;
    return block;
  };

  Object.keys(document.sequences).forEach(
    seqId => {
      document.modifySequence(
        seqId,
        null,
        null,
        filterItem,
        rewriteBlock,
        null,
      );
    },
  );
  Object.values(document.sequences).forEach(
    seq => docSet.updateBlockIndexesAfterFilter(seq),
  );
  document.gcSequences();
};

export { succinctFilter };
