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
    this.selectors = this.validateSelectors(defaultedSelectors);
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
    this.selectors = this.validateSelectors(succinctJson.metadata.selectors);
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

  validateSelectors(selectors) {
    if (typeof selectors !== 'object') {
      throw new Error(`DocSet constructor expects selectors to be object, found ${typeof this.selectors}`);
    }

    const expectedSelectors = {};

    for (const selector of this.processor.selectors) {
      expectedSelectors[selector.name] = selector;
    }

    for (const [name, value] of Object.entries(selectors)) {
      if (!(name in expectedSelectors)) {
        throw new Error(`Unexpected selector '${name}' (expected one of [${Object.keys(expectedSelectors).join(', ')}])`);
      }

      if (
        (typeof value === 'string' && expectedSelectors[name].type !== 'string') ||
        (typeof value === 'number' && expectedSelectors[name].type !== 'integer')
      ) {
        throw new Error(`Selector '${name}' is of type ${typeof value} (expected ${expectedSelectors[name].type})`);
      }

      if (typeof value === 'number') {
        if (!Number.isInteger(value)) {
          throw new Error(`Value '${value}' of integer selector '${name}' is not an integer`);
        }

        if ('min' in expectedSelectors[name] && value < expectedSelectors[name].min) {
          throw new Error(`Value '${value}' is less than ${expectedSelectors[name].min}`);
        }

        if ('max' in expectedSelectors[name] && value > expectedSelectors[name].max) {
          throw new Error(`Value '${value}' is greater than ${expectedSelectors[name].max}`);
        }
      } else {
        if ('regex' in expectedSelectors[name] && !xre.exec(value, xre(expectedSelectors[name].regex), 0)) {
          throw new Error(`Value '${value}' does not match regex '${expectedSelectors[name].regex}'`);
        }
      }

      if ('enum' in expectedSelectors[name] && !expectedSelectors[name].enum.includes(value)) {
        throw new Error(`Value '${value}' of selector '${name}' is not in enum`);
      }
    }

    for (const name of Object.keys(expectedSelectors)) {
      if (!(name in selectors)) {
        throw new Error(`Expected selector '${name}' not found`);
      }
    }
    return selectors;
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
    const ret = {};
    let pos = 0;
    let enumCount = 0;

    while (pos < succinct.length) {
      ret[succinct.countedString(pos)] = {
        'enum': enumCount++,
        'frequency': 0,
      };
      pos += succinct.byte(pos) + 1;
    }
    return ret;
  }

  recordPreEnum(category, value) {
    if (!(category in this.preEnums)) {
      throw new Error(`Unknown category ${category} in recordPreEnum. Maybe call buildPreEnums()?`);
    }

    if (!(value in this.preEnums[category])) {
      this.preEnums[category][value] = {
        'enum': Object.keys(this.preEnums[category]).length,
        'frequency': 1,
      };
    } else {
      this.preEnums[category][value].frequency++;
    }
  }

  sortPreEnums() {
    for (const category of Object.values(this.preEnums)) {
      let count = 0;

      for (const [k, v] of Object.entries(category).sort((a, b) => b[1].frequency - a[1].frequency)) {
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

    if (value in this.preEnums[category]) {
      return this.preEnums[category][value].enum;
    } else if (addUnknown) {
      this.preEnums[category][value] = {
        'enum': Object.keys(this.preEnums[category]).length,
        'frequency': 1,
      };
      this.enums[category].pushCountedString(value);
      this.buildEnumIndex(category);
      return this.preEnums[category][value].enum;
    } else {
      throw new Error(`Unknown value ${value} for category ${category} in enumForCategoryValue. Maybe call buildPreEnums()?`);
    }
  }

  buildEnums() {
    for (const [category, catOb] of Object.entries(this.preEnums)) {
      this.enums[category].clear();
      this.buildEnum(category, catOb);
    }
  }

  buildEnum(category, preEnumOb) {
    const sortedPreEnums = Object.entries(preEnumOb).sort((a, b) => a[1].enum - b[1].enum);

    for (const enumText of sortedPreEnums.map(pe => pe[0])) {
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
  unsuccinctifyBlock(block, options, includeContext) {
    this.maybeBuildEnumIndexes();
    const succinctBlockScope = block.bs;
    const [itemLength, itemType, itemSubtype] = headerBytes(succinctBlockScope, 0);
    const blockScope = this.unsuccinctifyScope(succinctBlockScope, itemType, itemSubtype, 0);
    const blockGrafts = this.unsuccinctifyGrafts(block.bg);
    const openScopes = this.unsuccinctifyScopes(block.os);
    const includedScopes = this.unsuccinctifyScopes(block.is);
    const blockItems = this.unsuccinctifyItems(block.c, options || {}, includeContext);
    return {
      bs: blockScope,
      bg: blockGrafts,
      c: blockItems,
      os: openScopes,
      is: includedScopes,
    };
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

  unsuccinctifyItemObjects(succinct, options) {
    const ret = [];

    for (const itemArray of this.unsuccinctifyItems(succinct, options, false, [])) {
      let item;

      if (['startScope', 'endScope'].includes(itemArray[0])) {
        item = [
          'scope',
          itemArray[0] === 'startScope' ? 'start' : 'end',
          itemArray[1],
        ];
      } else {
        item = [
          itemArray[0],
          itemArray[1],
          itemArray[2],
        ];
      }
      ret.push(item);
    }
    return ret;
  }

  unsuccinctifyItems(succinct, options, includeContext, openScopes) {
    if (includeContext === undefined) {
      throw new Error('includeContext must now be provided to unsuccinctifyItems');
    }

    const ret = [];
    let pos = 0;
    let tokenCount = 0;
    const scopes = new Set(openScopes || []);

    while (pos < succinct.length) {
      const [item, itemLength] = this.unsuccinctifyItem(succinct, pos, {});

      if (item[0] === 'token') {
        if ((Object.keys(options).length === 0) || options.tokens) {
          if (includeContext) {
            item.push(item[0] === 'token' && item[1] === 'wordLike' ? tokenCount++ : null);
            item.push([...scopes]);
          }
        }
        ret.push(item);
      } else if (item[0] === 'startScope') {
        scopes.add(item[1]);

        if ((Object.keys(options).length === 0) || options.scopes) {
          ret.push(item);
        }
      } else if (item[0] === 'endScope') {
        scopes.delete(item[1]);

        if ((Object.keys(options).length === 0) || options.scopes) {
          ret.push(item);
        }
      } else if (item[0] === 'graft') {
        if ((Object.keys(options).length === 0) || options.grafts) {
          ret.push(item);
        }
      }
      pos += itemLength;
    }
    return ret;
  }

  unsuccinctifyItem(succinct, pos, options) {
    let item = null;
    const [itemLength, itemType, itemSubtype] = headerBytes(succinct, pos);

    switch (itemType) {
    case itemEnum.token:
      if (Object.keys(options).length === 0 || options.tokens) {
        item = this.unsuccinctifyToken(succinct, itemSubtype, pos);
      }
      break;
    case itemEnum.startScope:
    case itemEnum.endScope:
      if (Object.keys(options).length === 0 || options.scopes) {
        item = this.unsuccinctifyScope(succinct, itemType, itemSubtype, pos);
      }
      break;
    case itemEnum.graft:
      if (Object.keys(options).length === 0 || options.grafts) {
        item = this.unsuccinctifyGraft(succinct, itemSubtype, pos);
      }
      break;
    }
    return [item, itemLength];
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
        (itemType === itemEnum.startScope) ? 'startScope' : 'endScope',
        this.succinctScopeLabel(succinct, itemSubtype, pos),
      ];
    } catch (err) {
      throw new Error(`Error from unsuccinctifyToken: ${err}`);
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
      throw new Error(`Error from unsuccinctifyToken: ${err}`);
    }
  }

  unsuccinctifyBlockScopeLabelsSet(block) {
    const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
    const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0);
    return new Set(
      this.unsuccinctifyScopes(block.os).concat(
        this.unsuccinctifyScopes(block.is),
      ).concat([blockScope])
        .map(ri => ri[1]));
  }

  unsuccinctifyPrunedItems(block, options, includeContext) {
    const openScopes = new Set(this.unsuccinctifyScopes(block.os).map(ri => ri[1]));
    const requiredScopes = options.requiredScopes || [];
    const anyScope = options.anyScope || false;

    const allScopesInItem = () => {
      for (const scope of requiredScopes) {
        if (!openScopes.has(scope)) {
          return false;
        }
      }
      return true;
    };

    const anyScopeInItem = () => {
      for (const scope of requiredScopes) {
        if (openScopes.has(scope)) {
          return true;
        }
      }
      return (requiredScopes.length === 0);
    };

    const scopeTest = anyScope ? anyScopeInItem : allScopesInItem;
    const charsTest = (item) =>
      !options.withChars ||
      options.withChars.length === 0 ||
      (item[0] === 'token' && options.withChars.includes(item[2]));
    const ret = [];

    for (const item of this.unsuccinctifyItems(block.c, options, includeContext, openScopes)) {
      if (item[0] === 'startScope') {
        openScopes.add(item[1]);
      }

      if (scopeTest() && charsTest(item)) {
        ret.push(item);
      }

      if (item[0] === 'endScope') {
        openScopes.delete(item[1]);
      }
    }
    return ret;
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
    const hasMiddleChapter = (b, fromC, toC) => {
      const blockChapterScopes = [
        ...this.unsuccinctifyScopes(b.os).map(s => s[1]),
        ...this.unsuccinctifyScopes(b.is).map(s => s[1]),
      ].filter(s => s.startsWith('chapter/'));
      return blockChapterScopes.map(s => parseInt(s.split('/')[1])).filter(n => n > fromC && n < toC).length > 0;
    };

    const hasFirstChapter = (b, fromC, fromV) => {
      const hasFirstChapterScope = [
        ...this.unsuccinctifyScopes(b.os).map(s => s[1]),
        ...this.unsuccinctifyScopes(b.is).map(s => s[1]),
      ].includes(`chapter/${fromC}`);
      return hasFirstChapterScope &&
        this.blockHasMatchingItem(
          b,
          (items, openScopes) => {
            if (!openScopes.has(`chapter/${fromC}`)) {
              return false;
            }
            return (
              Array.from(openScopes)
                .filter(s => s.startsWith('verse/'))
                .filter(s => parseInt(s.split('/')[1]) >= fromV).length
              > 0
            );
          },
          {},
        );
    };

    const hasLastChapter = (b, toC, toV) => {
      const hasLastChapterScope = [
        ...this.unsuccinctifyScopes(b.os).map(s => s[1]),
        ...this.unsuccinctifyScopes(b.is).map(s => s[1]),
      ].includes(`chapter/${toC}`);
      return hasLastChapterScope &&
        this.blockHasMatchingItem(
          b,
          (items, openScopes) => {
            if (!openScopes.has(`chapter/${toC}`)) {
              return false;
            }
            return (
              Array.from(openScopes)
                .filter(s => s.startsWith('verse/'))
                .filter(s => parseInt(s.split('/')[1]) <= toV).length
              > 0
            );
          },
          {},
        );
    };

    if (xre.exec(cv, xre('^[1-9][0-9]*$'))) {
      const scopes = [`chapter/${cv}`];
      return blocks.filter(b => this.allScopesInBlock(b, scopes));
    } else if (xre.exec(cv, xre('^[1-9][0-9]*-[1-9][0-9]*$'))) {
      const [fromC, toC] = cv.split('-').map(v => parseInt(v));

      if (fromC > toC) {
        throw new Error(`Chapter range must be from min to max, not '${cv}'`);
      }

      const scopes = [...Array((toC - fromC) + 1).keys()].map(n => `chapter/${n + fromC}`);
      return blocks.filter(b => this.anyScopeInBlock(b, scopes));
    } else if (xre.exec(cv, xre('^[1-9][0-9]*:[1-9][0-9]*$'))) {
      const [fromC, fromV] = cv.split(':').map(v => parseInt(v));
      const scopes = [`chapter/${fromC}`, `verse/${fromV}`];
      return blocks.filter(b => this.allScopesInBlock(b, scopes));
    } else if (xre.exec(cv, xre('^[1-9][0-9]*:[1-9][0-9]*-[1-9][0-9]*$'))) {
      const [fromC, vs] = cv.split(':');
      const [fromV, toV] = vs.split('-').map(v => parseInt(v));

      if (fromV > toV) {
        throw new Error(`Verse range must be from min to max, not '${vs}'`);
      }

      const chapterScopes = [`chapter/${fromC}`];
      const verseScopes = [...Array((toV - fromV) + 1).keys()].map(n => `verse/${n + fromV}`);
      return blocks.filter(b => this.allScopesInBlock(b, chapterScopes)).filter(b => this.anyScopeInBlock(b, verseScopes));
    } else if (xre.exec(cv, xre('^[1-9][0-9]*:[1-9][0-9]*-[1-9][0-9]*:[1-9][0-9]*$'))) {
      const [fromCV, toCV] = cv.split('-');
      const [fromC, fromV] = fromCV.split(':').map(c => parseInt(c));
      const [toC, toV] = toCV.split(':').map(v => parseInt(v));

      if (fromC > toC) {
        throw new Error(`Chapter range must be from min to max, not '${fromC}-${toV}'`);
      }

      const chapterScopes = [...Array((toC - fromC) + 1).keys()].map(n => `chapter/${n + fromC}`);
      const chapterBlocks = blocks.filter(b => this.anyScopeInBlock(b, chapterScopes));
      return chapterBlocks.filter(b => hasMiddleChapter(b, fromC, toC) || hasFirstChapter(b, fromC, fromV) || hasLastChapter(b, toC, toV));
    } else {
      throw new Error(`Bad cv reference '${cv}'`);
    }
  }

  allBlockScopes(block) {
    const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
    const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0);
    return new Set([
      ...this.unsuccinctifyScopes(block.os).map(s => s[1]),
      ...this.unsuccinctifyScopes(block.is).map(s => s[1]),
      blockScope[1],
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
    return (blockScope[1] === scope);
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

  unsuccinctifyItemsWithScriptureCV(block, cv, options, includeContext) {
    options = options || {};
    const openScopes = new Set(this.unsuccinctifyScopes(block.os).map(ri => ri[1]));

    const cvMatchFunction = () => {
      if (xre.exec(cv, xre('^[1-9][0-9]*$'))) {
        return () => openScopes.has(`chapter/${cv}`);
      } else if (xre.exec(cv, xre('^[1-9][0-9]*-[1-9][0-9]*$'))) {
        return () => {
          const [fromC, toC] = cv.split('-').map(v => parseInt(v));

          if (fromC > toC) {
            throw new Error(`Chapter range must be from min to max, not '${cv}'`);
          }

          for (const scope of [...Array((toC - fromC) + 1).keys()].map(n => `chapter/${n + fromC}`)) {
            if (openScopes.has(scope)) {
              return true;
            }
          }
          return false;
        };
      } else if (xre.exec(cv, xre('^[1-9][0-9]*:[1-9][0-9]*$'))) {
        return () => {
          const [fromC, fromV] = cv.split(':').map(v => parseInt(v));

          for (const scope of [`chapter/${fromC}`, `verse/${fromV}`]) {
            if (!openScopes.has(scope)) {
              return false;
            }
          }
          return true;
        };
      } else if (xre.exec(cv, xre('^[1-9][0-9]*:[1-9][0-9]*-[1-9][0-9]*$'))) {
        return () => {
          const [fromC, vs] = cv.split(':');
          const [fromV, toV] = vs.split('-').map(v => parseInt(v));

          if (fromV > toV) {
            throw new Error(`Verse range must be from min to max, not '${vs}'`);
          }

          const chapterScope = `chapter/${fromC}`;
          const verseScopes = [...Array((toV - fromV) + 1).keys()].map(n => `verse/${n + fromV}`);

          if (!openScopes.has(chapterScope)) {
            return false;
          }

          for (const scope of verseScopes) {
            if (openScopes.has(scope)) {
              return true;
            }
          }
          return false;
        };
      } else if (xre.exec(cv, xre('^[1-9][0-9]*:[1-9][0-9]*-[1-9][0-9]*:[1-9][0-9]*$'))) {
        return () => {
          const [fromCV, toCV] = cv.split('-');
          const [fromC, fromV] = fromCV.split(':').map(c => parseInt(c));
          const [toC, toV] = toCV.split(':').map(v => parseInt(v));

          if (fromC > toC) {
            throw new Error(`Chapter range must be from min to max, not '${fromC}-${toV}'`);
          }

          const scopeArray = [...openScopes];
          const chapterScopes = scopeArray.filter(s => s.startsWith('chapter/'));

          if (chapterScopes.length > 1) {
            throw new Error(`Expected zero or one chapter for item, found ${chapterScopes.length}`);
          }

          const chapterNo = parseInt(chapterScopes[0].split('/')[1]);

          if ((chapterNo < fromC) || (chapterNo > toC)) {
            return false;
          } else if (chapterNo === fromC) {
            return scopeArray.filter(s => s.startsWith('verse/') && parseInt(s.split('/')[1]) >= fromV).length > 0;
          } else if (chapterNo === toC) {
            return scopeArray.filter(s => s.startsWith('verse/') && parseInt(s.split('/')[1]) <= toV).length > 0;
          } else {
            return true;
          }
        };
      } else {
        throw new Error(`Bad cv reference '${cv}'`);
      }
    };

    const itemMatchesCV = cvMatchFunction();

    const itemInOptions = (item) => {
      if (!options || Object.keys(options).length === 0) {
        return true;
      } else {
        const itemType = item[0];
        return (
          (itemType === 'token' && 'tokens' in options) ||
          (itemType === 'graft' && 'grafts' in options) ||
          (itemType.endsWith('Scope') && 'scopes' in options)
        );
      }
    };

    const ret = [];

    for (const item of this.unsuccinctifyItems(block.c, {}, includeContext)) {
      if (item[0] === 'startScope') {
        openScopes.add(item[1]);
      }

      if (itemMatchesCV() && itemInOptions(item)) {
        ret.push(item);
      }

      if (item[0] === 'endScope') {
        openScopes.delete(item[1]);
      }
    }
    return ret;
  }

  blockHasMatchingItem(block, testFunction, options) {
    const openScopes = new Set(this.unsuccinctifyScopes(block.os).map(ri => ri[1]));

    for (const item of this.unsuccinctifyItems(block.c, options, false)) {
      if (item[0] === 'startScope') {
        openScopes.add(item[1]);
      }

      if (testFunction(item, openScopes)) {
        return true;
      }

      if (item[0] === 'endScope') {
        openScopes.delete(item[1]);
      }
    }
    return false;
  }

  sequenceItemsByScopes(blocks, byScopes, includeContext) {
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
      const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0)[1];
      const blockGrafts = this.unsuccinctifyGrafts(block.bg);

      allBlockScopes = new Set(this.unsuccinctifyScopes(block.os)
        .map(s => s[1])
        .concat([blockScope]),
      );

      for (const item of blockGrafts.concat(this.unsuccinctifyItems(block.c, {}, includeContext))) {
        if (item[0] === 'startScope') {
          allBlockScopes.add(item[1]);
        }

        if (allScopesPresent()) {
          const scopeKey = scopesString();

          if (!(scopeKey in scopes2array)) {
            scopes2array[scopeKey] = ret.length;
            ret.push([[...allBlockScopes], []]);
          }
          ret[ret.length - 1][1].push(item);
        }

        if (item[0] === 'endScope') {
          allBlockScopes.delete(item[1]);
        }
      }
    }
    return ret;
  }

  sequenceItemsByMilestones(blocks, byMilestones, includeContext) {
    // Return array of [scopes, items]
    // Scan block items
    // If milestone found:
    //   - add array
    // push item to last array
    let allBlockScopes = new Set([]);
    const milestoneFound = (item) => (item[0] === 'startScope') && byMilestones.includes(item[1]);

    this.maybeBuildEnumIndexes();
    const ret = [[[], []]];

    for (const block of blocks) {
      const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
      const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0)[1];
      const blockGrafts = this.unsuccinctifyGrafts(block.bg);
      allBlockScopes.add(blockScope);
      this.unsuccinctifyScopes(block.os).forEach(s => allBlockScopes.add(s[1]));
      const items = blockGrafts.concat(
        [blockScope].concat(
          this.unsuccinctifyItems(block.c, {}, includeContext),
        ),
      );

      for (const item of items) {
        if (item[0] === 'startScope') {
          allBlockScopes.add(item[1]);
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
      ret[ret.length - 1][1].push(['endScope', blockScope]);
      ret[ret.length - 1][1].push(['token', 'punctuation', '\n']);
    }
    ret[ret.length - 1][0] = [...allBlockScopes].sort();
    return ret;
  }

  rehash() {
    this.preEnums = {};

    for (const category of Object.keys(this.enums)) {
      this.preEnums[category] = {};
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

        if (enumString in this.preEnums[category]) {
          ret[category].push(this.preEnums[category][enumString].enum);
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

    const sequence = document.sequences[sequenceId];

    if (!sequence) {
      throw new Error(`Sequence '${sequenceId}' not found`);
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
    return true;
  }

  gcSequences() {
    let changed = false;

    Object.values(this.documents()).forEach(d => {
      changed = changed || d.gcSequences();
    });

    if (changed) {
      this.rehash();
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
