import {
  ByteArray,
  itemEnum,
  pushSuccinctGraftBytes,
  pushSuccinctScopeBytes,
  pushSuccinctTokenBytes,
  scopeEnum,
  tokenCategory,
  tokenEnum,
} from 'proskomma-utils';

const updateItems1 = (
  docSet,
  documentId,
  sequenceId,
  blockPosition,
  typedArrayName,
  itemObjects) => {
  const document = docSet.processor.documents[documentId];

  if (!document) {
    throw new Error(`Document '${documentId}' not found`);
  }

  let sequence;

  if (sequenceId) {
    sequence = document.sequences[sequenceId];

    if (!sequence) {
      throw new Error(`Sequence '${sequenceId}' not found`);
    }
  } else {
    sequence = document.sequences[document.mainId];
  }

  if (sequence.blocks.length <= blockPosition) {
    throw new Error(`Could not find block ${blockPosition} (length=${sequence.blocks.length})`);
  }

  const block = sequence.blocks[blockPosition];
  const newItemsBA = new ByteArray(itemObjects.length);
  docSet.maybeBuildPreEnums();

  for (const item of itemObjects) {
    switch (item.type) {
    case 'token':
      const charsEnumIndex = docSet.enumForCategoryValue(tokenCategory[item.subType], item.payload, true);
      pushSuccinctTokenBytes(newItemsBA, tokenEnum[item.subType], charsEnumIndex);
      break;
    case 'graft':
      const graftTypeEnumIndex = docSet.enumForCategoryValue('graftTypes', item.subType, true);
      const seqEnumIndex = docSet.enumForCategoryValue('ids', item.payload, true);
      pushSuccinctGraftBytes(newItemsBA, graftTypeEnumIndex, seqEnumIndex);
      break;
    case 'scope':
      const scopeBits = item.payload.split('/');
      const scopeTypeByte = scopeEnum[scopeBits[0]];

      if (!scopeTypeByte) {
        throw new Error(`"${scopeBits[0]}" is not a scope type`);
      }

      const scopeBitBytes = scopeBits.slice(1).map(b => docSet.enumForCategoryValue('scopeBits', b, true));
      pushSuccinctScopeBytes(newItemsBA, itemEnum[`${item.subType}Scope`], scopeTypeByte, scopeBitBytes);
      break;
    }
  }
  newItemsBA.trim();
  block[typedArrayName] = newItemsBA;
  docSet.updateBlockIndexesAfterEdit(sequence, blockPosition);
  document.buildChapterVerseIndex();
  return true;
};

const updateItems = (
  docSet,
  documentId,
  sequenceId,
  blockPosition,
  itemObjects) =>
  updateItems1(
    docSet,
    documentId,
    sequenceId,
    blockPosition,
    'c',
    itemObjects,
  );

const updateBlockGrafts = (
  docSet,
  documentId,
  sequenceId,
  blockPosition,
  itemObjects) =>
  updateItems1(
    docSet,
    documentId,
    sequenceId,
    blockPosition,
    'bg',
    itemObjects,
  );

const updateBlockIndexesAfterEdit = (docSet, sequence, blockPosition) => {
  const labelsMatch = (firstA, secondA) => {
    for (const first of Array.from(firstA)) {
      if (!secondA.has(first)) {
        return false;
      }
    }

    for (const second of Array.from(secondA)) {
      if (!firstA.has(second)) {
        return false;
      }
    }
    return true;
  };

  const addSuccinctScope = (docSet, succinct, scopeLabel) => {
    const scopeBits = scopeLabel.split('/');
    const scopeTypeByte = scopeEnum[scopeBits[0]];

    if (!scopeTypeByte) {
      throw new Error(`"${scopeBits[0]}" is not a scope type`);
    }

    const scopeBitBytes = scopeBits.slice(1).map(b => docSet.enumForCategoryValue('scopeBits', b, true));
    pushSuccinctScopeBytes(succinct, itemEnum[`startScope`], scopeTypeByte, scopeBitBytes);
  };

  const block = sequence.blocks[blockPosition];
  const includedScopeLabels = new Set();
  const openScopeLabels = new Set();

  for (const openScope of docSet.unsuccinctifyScopes(block.os)) {
    openScopeLabels.add(openScope[2]);
  }

  for (const scope of docSet.unsuccinctifyItems(block.c, { scopes: true }, null)) {
    if (scope[1] === 'start') {
      includedScopeLabels.add(scope[2]);
      openScopeLabels.add(scope[2]);
    } else {
      openScopeLabels.delete(scope[2]);
    }
  }

  const isArray = Array.from(includedScopeLabels);
  const isBA = new ByteArray(isArray.length);

  for (const scopeLabel of isArray) {
    addSuccinctScope(docSet, isBA, scopeLabel);
  }
  isBA.trim();
  block.is = isBA;

  if (blockPosition < (sequence.blocks.length - 1)) {
    const nextOsBlock = sequence.blocks[blockPosition + 1];
    const nextOsBA = nextOsBlock.os;
    const nextOSLabels = new Set(docSet.unsuccinctifyScopes(nextOsBA).map(s => s[2]));

    if (!labelsMatch(openScopeLabels, nextOSLabels)) {
      const osBA = new ByteArray(nextOSLabels.length);

      for (const scopeLabel of Array.from(openScopeLabels)) {
        addSuccinctScope(docSet, osBA, scopeLabel);
      }
      osBA.trim();
      nextOsBlock.os = osBA;
      docSet.updateBlockIndexesAfterEdit(sequence, blockPosition + 1);
    }
  }
};

const updateBlockIndexesAfterFilter = (docSet, sequence) => {
  const addSuccinctScope = (docSet, succinct, scopeLabel) => {
    const scopeBits = scopeLabel.split('/');
    const scopeTypeByte = scopeEnum[scopeBits[0]];

    if (!scopeTypeByte) {
      throw new Error(`"${scopeBits[0]}" is not a scope type`);
    }

    const scopeBitBytes = scopeBits.slice(1).map(b => docSet.enumForCategoryValue('scopeBits', b, true));
    pushSuccinctScopeBytes(succinct, itemEnum[`startScope`], scopeTypeByte, scopeBitBytes);
  };

  const openScopeLabels = new Set();

  for (const block of sequence.blocks) {
    const osArray = Array.from(openScopeLabels);
    const osBA = new ByteArray(osArray.length);

    for (const scopeLabel of osArray) {
      addSuccinctScope(docSet, osBA, scopeLabel);
    }
    osBA.trim();
    block.os = osBA;
    const includedScopeLabels = new Set();

    for (const scope of docSet.unsuccinctifyItems(block.c, { scopes: true }, null)) {
      if (scope[1] === 'start') {
        includedScopeLabels.add(scope[2]);
        openScopeLabels.add(scope[2]);
      } else {
        openScopeLabels.delete(scope[2]);
      }
    }

    const isArray = Array.from(includedScopeLabels);
    const isBA = new ByteArray(isArray.length);

    for (const scopeLabel of isArray) {
      addSuccinctScope(docSet, isBA, scopeLabel);
    }
    isBA.trim();
    block.is = isBA;
  }
};

module.exports = {
  updateItems,
  updateBlockGrafts,
  updateBlockIndexesAfterEdit,
  updateBlockIndexesAfterFilter,
};
