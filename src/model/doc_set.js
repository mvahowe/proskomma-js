import xre from 'xregexp';
import {
  addTag,
  ByteArray,
  enumIndex,
  enumIndexes,
  headerBytes,
  itemEnum,
  pushSuccinctGraftBytes,
  pushSuccinctScopeBytes,
  pushSuccinctTokenBytes,
  removeTag,
  scopeEnum,
  succinctGraftName,
  succinctGraftSeqId,
  succinctScopeLabel,
  succinctTokenChars,
  tokenCategory,
  tokenEnum,
  tokenEnumLabels,
  validateTags,
} from 'proskomma-utils';
import { validateSelectors } from './doc_set_helpers/selectors';
import { blocksWithScriptureCV } from './doc_set_helpers/scripture_cv';
import {
  unsuccinctifyBlock,
  unsuccinctifyItems,
  unsuccinctifyItem,
  unsuccinctifyPrunedItems,
  unsuccinctifyItemsWithScriptureCV,
} from './doc_set_helpers/unsuccinctify';

class DocSet {
  constructor(processor, selectors, tags, succinctJson) {
    this.processor = processor;
    this.preEnums = {};
    this.enumIndexes = {};
    this.docIds = [];

    if (succinctJson) {
      this.fromSuccinct(processor, succinctJson);
    } else {
      this.fromScratch(processor, selectors, tags);
    }
    validateTags(this.tags);
  }

  fromScratch(processor, selectors, tags) {
    const defaultedSelectors = selectors || processor.selectors;
    this.selectors = validateSelectors(this, defaultedSelectors);
    this.id = this.selectorString();
    this.tags = new Set(tags || []);
    this.enums = {
      ids: new ByteArray(512),
      wordLike: new ByteArray(8192),
      notWordLike: new ByteArray(256),
      scopeBits: new ByteArray(256),
      graftTypes: new ByteArray(10),
    };
  }

  fromSuccinct(processor, succinctJson) {
    const populatedByteArray = (succinct) => {
      const ret = new ByteArray(256);
      ret.fromBase64(succinct);
      ret.trim();
      return ret;
    };

    this.id = succinctJson.id;
    this.selectors = validateSelectors(this, succinctJson.metadata.selectors);
    this.tags = new Set(succinctJson.tags);
    validateTags(this.tags);
    this.preEnums = {};
    this.enums = {
      ids: populatedByteArray(succinctJson.enums.ids),
      wordLike: populatedByteArray(succinctJson.enums.wordLike),
      notWordLike: populatedByteArray(succinctJson.enums.notWordLike),
      scopeBits: populatedByteArray(succinctJson.enums.scopeBits),
      graftTypes: populatedByteArray(succinctJson.enums.graftTypes),
    };
    this.enumIndexes = {};
    this.docIds = [];
  }

  addTag(tag) {
    addTag(this.tags, tag);
  }

  removeTag(tag) {
    removeTag(this.tags, tag);
  }

  selectorString() {
    return this.processor.selectorString(this.selectors);
  }

  documents() {
    return this.docIds.map(did => this.processor.documents[did]);
  }

  documentWithBook(bookCode) {
    const docsWithBook = Object.values(this.documents()).filter(doc => 'bookCode' in doc.headers && doc.headers['bookCode'] === bookCode);
    return docsWithBook.length === 1 ? docsWithBook[0] : null;
  }

  maybeBuildPreEnums() {
    if (Object.keys(this.preEnums).length === 0) {
      this.buildPreEnums();
    }
  }

  buildPreEnums() {
    for (const [category, succinct] of Object.entries(this.enums)) {
      this.preEnums[category] = this.buildPreEnum(succinct);
    }
  }

  buildPreEnum(succinct) {
    const ret = new Map();
    let pos = 0;
    let enumCount = 0;

    while (pos < succinct.length) {
      ret.set(
        succinct.countedString(pos),
        {
          'enum': enumCount++,
          'frequency': 0,
        },
      );
      pos += succinct.byte(pos) + 1;
    }

    return ret;
  }

  recordPreEnum(category, value) {
    if (!(category in this.preEnums)) {
      throw new Error(`Unknown category ${category} in recordPreEnum. Maybe call buildPreEnums()?`);
    }

    if (!this.preEnums[category].has(value)) {
      this.preEnums[category].set(
        value,
        {
          'enum': this.preEnums[category].size,
          'frequency': 1,
        },
      );
    } else {
      this.preEnums[category].get(value).frequency++;
    }
  }

  sortPreEnums() {
    for (const catKey of Object.keys(this.preEnums)) {
      this.preEnums[catKey] = new Map([...this.preEnums[catKey].entries()].sort((a, b) => b[1].frequency - a[1].frequency));

      let count = 0;

      for (const [k, v] of this.preEnums[catKey]) {
        v.enum = count++;
      }
    }
  }

  enumForCategoryValue(category, value, addUnknown) {
    if (!addUnknown) {
      addUnknown = false;
    }

    if (!(category in this.preEnums)) {
      throw new Error(`Unknown category ${category} in recordPreEnum. Maybe call buildPreEnums()?`);
    }

    if (this.preEnums[category].has(value)) {
      return this.preEnums[category].get(value).enum;
    } else if (addUnknown) {
      this.preEnums[category].set(
        value,
        {
          'enum': this.preEnums[category].size,
          'frequency': 1,
        },
      );
      this.enums[category].pushCountedString(value);
      this.buildEnumIndex(category);
      return this.preEnums[category].get(value).enum;
    } else {
      throw new Error(`Unknown value '${value}' for category ${category} in enumForCategoryValue. Maybe call buildPreEnums()?`);
    }
  }

  buildEnums() {
    for (const [category, catOb] of Object.entries(this.preEnums)) {
      this.enums[category].clear();
      this.buildEnum(category, catOb);
    }
  }

  buildEnum(category, preEnumOb) {
    const sortedPreEnums = new Map([...preEnumOb.entries()]);

    for (const enumText of sortedPreEnums.keys()) {
      this.enums[category].pushCountedString(enumText);
    }
    this.enums[category].trim();
  }

  maybeBuildEnumIndexes() {
    if (Object.keys(this.enumIndexes).length === 0) {
      this.buildEnumIndexes();
    }
  }

  buildEnumIndexes() {
    this.enumIndexes = enumIndexes(this.enums);
  }

  buildEnumIndex(category) {
    this.enumIndexes[category] = enumIndex(category, this.enums[category]);
  }

  unsuccinctifyBlock(block, options) {
    return unsuccinctifyBlock(this, block, options);
  }

  unsuccinctifyItems(succinct, options, nextToken, openScopes) {
    return unsuccinctifyItems(this, succinct, options, nextToken, openScopes);
  }

  unsuccinctifyItem(succinct, pos, options) {
    return unsuccinctifyItem(this, succinct, pos, options);
  }

  unsuccinctifyPrunedItems(block, options) {
    return unsuccinctifyPrunedItems(this, block, options);
  }

  countItems(succinct) {
    let count = 0;
    let pos = 0;

    while (pos < succinct.length) {
      count++;
      const headerByte = succinct.byte(pos);
      const itemLength = headerByte & 0x0000003F;
      pos += itemLength;
    }
    return count;
  }

  unsuccinctifyScopes(succinct) {
    const ret = [];
    let pos = 0;

    while (pos < succinct.length) {
      const [itemLength, itemType, itemSubtype] = headerBytes(succinct, pos);
      ret.push(this.unsuccinctifyScope(succinct, itemType, itemSubtype, pos));
      pos += itemLength;
    }
    return ret;
  }

  unsuccinctifyGrafts(succinct) {
    const ret = [];
    let pos = 0;

    while (pos < succinct.length) {
      const [itemLength, itemType, itemSubtype] = headerBytes(succinct, pos);
      ret.push(this.unsuccinctifyGraft(succinct, itemSubtype, pos));
      pos += itemLength;
    }
    return ret;
  }

  itemsByIndex(mainSequence, index, includeContext) {
    let ret = [];

    if (!index) {
      return ret;
    }

    let currentBlock = index.startBlock;
    let nextToken = index.nextToken;

    while (currentBlock <= index.endBlock) {
      let blockItems = this.unsuccinctifyItems(mainSequence.blocks[currentBlock].c, {}, nextToken);
      const blockScope = this.unsuccinctifyScopes(mainSequence.blocks[currentBlock].bs)[0];
      const blockGrafts = this.unsuccinctifyGrafts(mainSequence.blocks[currentBlock].bg);

      if (currentBlock === index.startBlock && currentBlock === index.endBlock) {
        blockItems = blockItems.slice(index.startItem, index.endItem + 1);
      } else if (currentBlock === index.startBlock) {
        blockItems = blockItems.slice(index.startItem);
      } else if (currentBlock === index.endBlock) {
        blockItems = blockItems.slice(0, index.endItem + 1);
      }

      if (includeContext) {
        let extendedBlockItems = [];

        for (const bi of blockItems) {
          extendedBlockItems.push(bi.concat([bi[0] === 'token' && bi[1] === 'wordLike' ? nextToken++ : null]));
        }
        blockItems = extendedBlockItems;
      }
      ret.push([...blockGrafts, ['scope', 'start', blockScope[2]], ...blockItems, ['scope', 'end', blockScope[2]]]);
      currentBlock++;
    }
    return ret;
  }

  unsuccinctifyToken(succinct, itemSubtype, pos) {
    try {
      return [
        'token',
        tokenEnumLabels[itemSubtype],
        this.succinctTokenChars(succinct, itemSubtype, pos),
      ];
    } catch (err) {
      throw new Error(`Error from unsuccinctifyToken: ${err}`);
    }
  }

  unsuccinctifyScope(succinct, itemType, itemSubtype, pos) {
    try {
      return [
        'scope',
        (itemType === itemEnum.startScope) ? 'start' : 'end',
        this.succinctScopeLabel(succinct, itemSubtype, pos),
      ];
    } catch (err) {
      throw new Error(`Error from unsuccinctifyScope: ${err}`);
    }
  }

  unsuccinctifyGraft(succinct, itemSubtype, pos) {
    try {
      return [
        'graft',
        this.succinctGraftName(itemSubtype),
        this.succinctGraftSeqId(succinct, pos),
      ];
    } catch (err) {
      throw new Error(`Error from unsuccinctifyGraft: ${err}`);
    }
  }

  unsuccinctifyBlockScopeLabelsSet(block) {
    const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
    const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0);
    return new Set(
      this.unsuccinctifyScopes(block.os).concat(
        this.unsuccinctifyScopes(block.is),
      ).concat([blockScope])
        .map(ri => ri[2]));
  }

  succinctTokenChars(succinct, itemSubtype, pos) {
    return succinctTokenChars(this.enums, this.enumIndexes, succinct, itemSubtype, pos);
  }

  succinctScopeLabel(succinct, itemSubtype, pos) {
    return succinctScopeLabel(this.enums, this.enumIndexes, succinct, itemSubtype, pos);
  }

  succinctGraftName(itemSubtype) {
    return succinctGraftName(this.enums, this.enumIndexes, itemSubtype);
  }

  succinctGraftSeqId(succinct, pos) {
    return succinctGraftSeqId(this.enums, this.enumIndexes, succinct, pos);
  }
  blocksWithScriptureCV(blocks, cv) {
    return blocksWithScriptureCV(this, blocks, cv);
  }

  allBlockScopes(block) {
    const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
    const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0);
    return new Set([
      ...this.unsuccinctifyScopes(block.os).map(s => s[2]),
      ...this.unsuccinctifyScopes(block.is).map(s => s[2]),
      blockScope[2],
    ],
    );
  }

  allScopesInBlock(block, scopes) {
    const allBlockScopes = this.allBlockScopes(block);

    for (const scope of scopes) {
      if (!allBlockScopes.has(scope)) {
        return false;
      }
    }
    return true;
  }

  anyScopeInBlock(block, scopes) {
    const allBlockScopes = this.allBlockScopes(block);

    for (const scope of scopes) {
      if (allBlockScopes.has(scope)) {
        return true;
      }
    }
    return false;
  }

  blockHasBlockScope(block, scope) {
    const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
    const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0);
    return (blockScope[2] === scope);
  }

  blockHasChars(block, charsIndexes) {
    let ret = false;
    let pos = 0;
    const succinct = block.c;

    if (charsIndexes.includes(-1)) {
      return false;
    }

    while (!ret && (pos < succinct.length)) {
      const [itemLength, itemType] = headerBytes(succinct, pos);

      if (itemType === itemEnum['token']) {
        if (charsIndexes.includes(succinct.nByte(pos + 2))) {
          ret = true;
        }
      }
      pos += itemLength;
    }
    return ret;
  }

  unsuccinctifyItemsWithScriptureCV(block, cv, options) {
    return unsuccinctifyItemsWithScriptureCV(this, block, cv, options);
  }

  blockHasMatchingItem(block, testFunction, options) {
    const openScopes = new Set(this.unsuccinctifyScopes(block.os).map(ri => ri[2]));

    for (const item of this.unsuccinctifyItems(block.c, options, 0)) {
      if (item[0] === 'scope' && item[1] === 'start') {
        openScopes.add(item[2]);
      }

      if (testFunction(item, openScopes)) {
        return true;
      }

      if (item[0] === 'scope' && item[1] === 'end') {
        openScopes.delete(item[2]);
      }
    }
    return false;
  }

  sequenceItemsByScopes(blocks, byScopes) {
    // Return array of [scopes, items]
    // Scan block items, track scopes
    // If all scopes found:
    //   - turn found scopes into string
    //   - if that scope string doesn't exist, add to lookup table and push array
    //   - add item to array matching scope string
    let allBlockScopes = [];

    const allScopesPresent = () => {
      for (const requiredScope of byScopes) {
        if (!matchingScope(requiredScope)) {
          return false;
        }
      }
      return true;
    };

    const matchingScope = (scopeToMatch) => {
      for (const blockScope of allBlockScopes) {
        if (blockScope.startsWith(scopeToMatch)) {
          return blockScope;
        }
      }
      return null;
    };

    const scopesString = () => byScopes.map(s => matchingScope(s)).sort().join('_');

    this.maybeBuildEnumIndexes();
    const ret = [];
    const scopes2array = {};

    for (const block of blocks) {
      const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
      const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0)[2];
      const startBlockScope = ['scope', 'start', blockScope];
      const endBlockScope = ['scope', 'end', blockScope];
      const blockGrafts = this.unsuccinctifyGrafts(block.bg);

      allBlockScopes = new Set(this.unsuccinctifyScopes(block.os)
        .map(s => s[2])
        .concat([blockScope]),
      );

      for (
        const item of blockGrafts.concat(
          [
            startBlockScope,
            ...this.unsuccinctifyItems(block.c, {}, block.nt.nByte(0), allBlockScopes),
            endBlockScope,
          ],
        )
      ) {
        if (item[0] === 'scope' && item[1] === 'start') {
          allBlockScopes.add(item[2]);
        }

        if (allScopesPresent()) {
          const scopeKey = scopesString();

          if (!(scopeKey in scopes2array)) {
            scopes2array[scopeKey] = ret.length;
            ret.push([[...allBlockScopes], []]);
          }
          ret[ret.length - 1][1].push(item);
        }

        if (item[0] === 'scope' && item[1] === 'end') {
          allBlockScopes.delete(item[2]);
        }
      }
    }
    return ret;
  }

  sequenceItemsByMilestones(blocks, byMilestones) {
    // Return array of [scopes, items]
    // Scan block items
    // If milestone found:
    //   - add array
    // push item to last array
    let allBlockScopes = new Set([]);
    const milestoneFound = (item) => item[0] === 'scope' && item[1] === 'start' && byMilestones.includes(item[2]);

    this.maybeBuildEnumIndexes();
    const ret = [[[], []]];

    for (const block of blocks) {
      const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
      const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0)[2];
      const blockGrafts = this.unsuccinctifyGrafts(block.bg);
      allBlockScopes.add(blockScope);
      this.unsuccinctifyScopes(block.os).forEach(s => allBlockScopes.add(s[2]));
      const items = blockGrafts.concat(
        [blockScope].concat(
          this.unsuccinctifyItems(block.c, {}, block.nt.nByte(0)),
        ),
      );

      for (const item of items) {
        if (item[0] === 'scope' && item[1] === 'start') {
          allBlockScopes.add(item[2]);
        }

        if (milestoneFound(item)) {
          ret[ret.length - 1][0] = [...allBlockScopes].sort();
          ret.push([[], []]);

          for (
            const bs of [...allBlockScopes]
              .filter(
                s => {
                  const excludes = ['blockTag', 'verse', 'verses', 'chapter'];
                  return excludes.includes(s.split('/')[0]) || byMilestones.includes(s);
                },
              )
          ) {
            allBlockScopes.delete(bs);
          }
          allBlockScopes.add(blockScope);
        }
        ret[ret.length - 1][1].push(item);
      }
      ret[ret.length - 1][1].push(['scope', 'end', blockScope]);
      ret[ret.length - 1][1].push(['token', 'punctuation', '\n']);
    }
    ret[ret.length - 1][0] = [...allBlockScopes].sort();
    return ret;
  }

  rehash() {
    this.preEnums = {};

    for (const category of Object.keys(this.enums)) {
      this.preEnums[category] = new Map();
    }
    this.maybeBuildEnumIndexes();

    for (const document of this.documents()) {
      for (const sequence of Object.values(document.sequences)) {
        document.rerecordPreEnums(this, sequence);
      }
    }
    this.sortPreEnums();
    const oldToNew = this.makeRehashEnumMap();

    for (const document of this.documents()) {
      for (const sequence of Object.values(document.sequences)) {
        document.rewriteSequenceBlocks(sequence.id, oldToNew);
      }
    }
    this.buildEnums();
    this.buildEnumIndexes();
    return true;
  }

  makeRehashEnumMap() {
    const ret = {};

    for (const [category, enumSuccinct] of Object.entries(this.enums)) {
      ret[category] = [];
      let pos = 0;

      while (pos < enumSuccinct.length) {
        const stringLength = enumSuccinct.byte(pos);
        const enumString = enumSuccinct.countedString(pos);

        if (this.preEnums[category].has(enumString)) {
          ret[category].push(this.preEnums[category].get(enumString).enum);
        } else {
          ret[category].push(null);
        }

        pos += stringLength + 1;
      }
    }
    return ret;
  }

  updateItems(
    documentId,
    sequenceId,
    blockPosition,
    itemObjects) {
    const document = this.processor.documents[documentId];

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
    this.maybeBuildPreEnums();

    for (const item of itemObjects) {
      switch (item.type) {
      case 'token':
        const charsEnumIndex = this.enumForCategoryValue(tokenCategory[item.subType], item.payload, true);
        pushSuccinctTokenBytes(newItemsBA, tokenEnum[item.subType], charsEnumIndex);
        break;
      case 'graft':
        const graftTypeEnumIndex = this.enumForCategoryValue('graftTypes', item.subType, true);
        const seqEnumIndex = this.enumForCategoryValue('ids', item.payload, true);
        pushSuccinctGraftBytes(newItemsBA, graftTypeEnumIndex, seqEnumIndex);
        break;
      case 'scope':
        const scopeBits = item.payload.split('/');
        const scopeTypeByte = scopeEnum[scopeBits[0]];

        if (!scopeTypeByte) {
          throw new Error(`"${scopeBits[0]}" is not a scope type`);
        }

        const scopeBitBytes = scopeBits.slice(1).map(b => this.enumForCategoryValue('scopeBits', b, true));
        pushSuccinctScopeBytes(newItemsBA, itemEnum[`${item.subType}Scope`], scopeTypeByte, scopeBitBytes);
        break;
      }
    }
    newItemsBA.trim();
    block.c = newItemsBA;
    this.updateBlockIndexesAfterEdit(sequence, blockPosition);
    document.buildChapterVerseIndex();
    return true;
  }

  updateBlockIndexesAfterEdit(sequence, blockPosition) {
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

    for (const openScope of this.unsuccinctifyScopes(block.os)) {
      openScopeLabels.add(openScope[2]);
    }

    for (const scope of this.unsuccinctifyItems(block.c, { scopes: true }, null)) {
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
      addSuccinctScope(this, isBA, scopeLabel);
    }
    isBA.trim();
    block.is = isBA;

    if (blockPosition < (sequence.blocks.length - 1)) {
      const nextOsBlock = sequence.blocks[blockPosition + 1];
      const nextOsBA = nextOsBlock.os;
      const nextOSLabels = new Set(this.unsuccinctifyScopes(nextOsBA).map(s => s[2]));

      if (!labelsMatch(openScopeLabels, nextOSLabels)) {
        const osBA = new ByteArray(nextOSLabels.length);

        for (const scopeLabel of Array.from(openScopeLabels)) {
          addSuccinctScope(this, osBA, scopeLabel);
        }
        osBA.trim();
        nextOsBlock.os = osBA;
        this.updateBlockIndexesAfterEdit(sequence, blockPosition + 1);
      }
    }
  }

  updateBlockIndexesAfterFilter(sequence) {
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
        addSuccinctScope(this, osBA, scopeLabel);
      }
      osBA.trim();
      block.os = osBA;
      const includedScopeLabels = new Set();

      for (const scope of this.unsuccinctifyItems(block.c, { scopes: true }, null)) {
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
        addSuccinctScope(this, isBA, scopeLabel);
      }
      isBA.trim();
      block.is = isBA;
    }
  }

  serializeSuccinct() {
    const ret = {
      id: this.id,
      metadata: { selectors: this.selectors },
      enums: {},
      docs: {},
      tags: Array.from(this.tags),
    };

    for (const [eK, eV] of Object.entries(this.enums)) {
      ret.enums[eK] = eV.base64();
    }
    ret.docs = {};

    for (const docId of this.docIds) {
      ret.docs[docId] = this.processor.documents[docId].serializeSuccinct();
    }
    return ret;
  }
}

module.exports = { DocSet };
