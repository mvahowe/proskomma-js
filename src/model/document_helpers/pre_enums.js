import { nComponentsForScope } from 'proskomma-utils';

const recordPreEnums = (docSet, seq) => {
  docSet.recordPreEnum('scopeBits', '0');

  for (const [blockN, block] of seq.blocks.entries()) {
    for (const [itemN, item] of [...block.items, block.bs, ...block.bg].entries()) {
      if (item.subType === 'wordLike') {
        docSet.recordPreEnum('wordLike', item.payload);
      } else if (['lineSpace', 'eol', 'punctuation', 'softLineBreak', 'bareSlash', 'unknown'].includes(item.subType)) {
        docSet.recordPreEnum('notWordLike', item.payload);
      } else if (item.type === 'graft') {
        docSet.recordPreEnum('graftTypes', item.subType);
      } else if (item.subType === 'start') {
        const labelBits = item.payload.split('/');

        if (labelBits.length !== nComponentsForScope(labelBits[0])) {
          throw new Error(`Scope ${item.payload} has unexpected number of components`);
        }

        for (const labelBit of labelBits.slice(1)) {
          docSet.recordPreEnum('scopeBits', labelBit);
        }
      }
    }
  }
};

const rerecordPreEnums = (docSet, seq) => {
  docSet.recordPreEnum('scopeBits', '0');
  docSet.recordPreEnum('ids', seq.id);

  for (const block of seq.blocks) {
    for (const blockKey of ['bs', 'bg', 'c', 'is', 'os']) {
      rerecordBlockPreEnums(docSet, block[blockKey]);
    }
  }
};

const rerecordBlockPreEnums= (docSet, ba) => {
  for (const item of docSet.unsuccinctifyItems(ba, {}, 0)) {
    if (item[0] === 'token') {
      if (item[1] === 'wordLike') {
        docSet.recordPreEnum('wordLike', item[2]);
      } else {
        docSet.recordPreEnum('notWordLike', item[2]);
      }
    } else if (item[0] === 'graft') {
      docSet.recordPreEnum('graftTypes', item[1]);
    } else if (item[0] === 'scope' && item[1] === 'start') {
      const labelBits = item[2].split('/');

      if (labelBits.length !== nComponentsForScope(labelBits[0])) {
        throw new Error(`Scope ${item[2]} has unexpected number of components`);
      }

      for (const labelBit of labelBits.slice(1)) {
        docSet.recordPreEnum('scopeBits', labelBit);
      }
    }
  }
};

export {
  recordPreEnums,
  rerecordPreEnums,
};
