const {
  addTag,
  ByteArray,
  generateId,
  headerBytes,
  itemEnum,
  nComponentsForScope,
  pushSuccinctGraftBytes,
  pushSuccinctScopeBytes,
  pushSuccinctTokenBytes,
  removeTag,
  scopeEnumLabels,
  succinctGraftSeqId,
  tokenEnum,
  validateTags,
} = require('proskomma-utils');
const {
  parseUsfm,
  parseUsx,
  parseLexicon,
} = require('../parser/lexers');
const { Parser } = require('../parser');

class Document {
  constructor(processor, docSetId, contentType, contentString, filterOptions, customTags, emptyBlocks, tags) {
    this.processor = processor;
    this.docSetId = docSetId;
    this.baseSequenceTypes = { // Copied from parser: revisit with generic parsing
      main: '1',
      introduction: '*',
      introTitle: '?',
      introEndTitle: '?',
      title: '?',
      endTitle: '?',
      heading: '*',
      header: '*',
      remark: '*',
      sidebar: '*',
    };

    if (contentType) {
      this.id = generateId();
      this.filterOptions = filterOptions;
      this.customTags = customTags;
      this.emptyBlocks = emptyBlocks;
      this.tags = new Set(tags || []);
      validateTags(this.tags);
      this.headers = {};
      this.mainId = null;
      this.sequences = {};

      switch (contentType) {
      case 'usfm':
        this.processUsfm(contentString);
        break;
      case 'usx':
        this.processUsx(contentString);
        break;
      case 'lexicon':
        this.processLexicon(contentString);
        break;
      default:
        throw new Error(`Unknown document contentType '${contentType}'`);
      }
    }
  }

  addTag(tag) {
    addTag(this.tags, tag);
  }

  removeTag(tag) {
    removeTag(this.tags, tag);
  }

  makeParser() {
    return new Parser(
      this.filterOptions,
      this.customTags,
      this.emptyBlocks,
    );
  }

  processUsfm(usfmString) {
    const parser = this.makeParser();
    parseUsfm(usfmString, parser);
    this.postParseScripture(parser);
  }

  processUsx(usxString) {
    const parser = this.makeParser();
    parseUsx(usxString, parser);
    this.postParseScripture(parser);
  }

  postParseScripture(parser) {
    parser.tidy();
    parser.filter();
    this.headers = parser.headers;
    this.succinctPass1(parser);
    this.succinctPass2(parser);
  }

  processLexicon(lexiconString) {
    const parser = this.makeParser();
    parseLexicon(lexiconString, parser);
    this.headers = parser.headers;
    this.succinctPass1(parser);
    this.succinctPass2(parser);
  }

  succinctPass1(parser) {
    const docSet = this.processor.docSets[this.docSetId];

    for (const seq of parser.allSequences()) {
      docSet.recordPreEnum('ids', seq.id);
      this.recordPreEnums(docSet, seq);
    }

    if (docSet.enums.wordLike.length === 0) {
      docSet.sortPreEnums();
    }
    docSet.buildEnums();
  }

  recordPreEnums(docSet, seq) {
    for (const block of seq.blocks) {
      for (const item of [...block.items, block.blockScope, ...block.blockGrafts]) {
        if (item.itemType === 'wordLike') {
          docSet.recordPreEnum('wordLike', item.chars);
        } else if (['lineSpace', 'eol', 'punctuation', 'softLineBreak', 'bareSlash', 'unknown'].includes(item.itemType)) {
          docSet.recordPreEnum('notWordLike', item.chars);
        } else if (item.itemType === 'graft') {
          docSet.recordPreEnum('graftTypes', item.graftType);
        } else if (item.itemType === 'startScope') {
          const labelBits = item.label.split('/');

          if (labelBits.length !== nComponentsForScope(labelBits[0])) {
            throw new Error(`Scope ${item.label} has unexpected number of components`);
          }

          for (const labelBit of labelBits.slice(1)) {
            docSet.recordPreEnum('scopeBits', labelBit);
          }
        }
      }
    }
  }

  rerecordPreEnums(docSet, seq) {
    docSet.recordPreEnum('ids', seq.id);

    for (const block of seq.blocks) {
      for (const blockKey of ['bs', 'bg', 'c', 'is', 'os']) {
        this.rerecordBlockPreEnums(docSet, block[blockKey]);
      }
    }
  }

  rerecordBlockPreEnums(docSet, ba) {
    for (const item of docSet.unsuccinctifyItems(ba, {}, false)) {
      if (item[0] === 'token') {
        if (item[1] === 'wordLike') {
          docSet.recordPreEnum('wordLike', item[2]);
        } else {
          docSet.recordPreEnum('notWordLike', item[2]);
        }
      } else if (item[0] === 'graft') {
        docSet.recordPreEnum('graftTypes', item[1]);
      } else if (item[0] === 'startScope') {
        const labelBits = item[1].split('/');

        if (labelBits.length !== nComponentsForScope(labelBits[0])) {
          throw new Error(`Scope ${item[1]} has unexpected number of components`);
        }

        for (const labelBit of labelBits.slice(1)) {
          docSet.recordPreEnum('scopeBits', labelBit);
        }
      }
    }
  }

  succinctPass2(parser) {
    const docSet = this.processor.docSets[this.docSetId];
    this.mainId = parser.sequences.main.id;

    for (const seq of parser.allSequences()) {
      this.sequences[seq.id] = {
        id: seq.id,
        type: seq.type,
        tags: new Set(seq.tags),
        isBaseType: (seq.type in parser.baseSequenceTypes),
        blocks: seq.succinctifyBlocks(docSet),
      };
    }
  }

  rewriteSequenceBlocks(sequenceId, oldToNew) {
    const sequence = this.sequences[sequenceId];

    for (const block of sequence.blocks) {
      this.rewriteSequenceBlock(block, oldToNew);
    }
  }

  rewriteSequenceBlock(block, oldToNew) {
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
  }

  serializeSuccinct() {
    const ret = { sequences: {} };
    ret.headers = this.headers;
    ret.mainId = this.mainId;
    ret.tags = Array.from(this.tags);

    for (const [seqId, seqOb] of Object.entries(this.sequences)) {
      ret.sequences[seqId] = this.serializeSuccinctSequence(seqOb);
    }
    return ret;
  }

  serializeSuccinctSequence(seqOb) {
    return {
      type: seqOb.type,
      blocks: seqOb.blocks.map(b => this.serializeSuccinctBlock(b)),
      tags: Array.from(seqOb.tags),
    };
  }

  serializeSuccinctBlock(blockOb) {
    return {
      bs: blockOb.bs.base64(),
      bg: blockOb.bg.base64(),
      c: blockOb.c.base64(),
      is: blockOb.is.base64(),
      os: blockOb.os.base64(),
    };
  }

  gcSequences() {
    const usedSequences = new Set();
    const docSet = this.processor.docSets[this.docSetId];

    const followGrafts = (document, sequence, used) => {
      used.add(sequence.id);

      for (const block of sequence.blocks) {
        for (const blockGraft of docSet.unsuccinctifyGrafts(block.bg)) {
          if (!used.has(blockGraft[2])) {
            followGrafts(document, document.sequences[blockGraft[2]], used);
          }
        }

        for (const inlineGraft of docSet.unsuccinctifyItems(block.c, { grafts: true }, false)) {
          if (!used.has(inlineGraft[2])) {
            followGrafts(document, document.sequences[inlineGraft[2]], used);
          }
        }
      }
    };

    followGrafts(this, this.sequences[this.mainId], usedSequences);
    let changed = false;

    for (const sequenceId of Object.keys(this.sequences)) {
      if (!usedSequences.has(sequenceId)) {
        delete this.sequences[sequenceId];
        changed = true;
      }
    }

    return changed;
  }

  newSequence(seqType) {
    const seqId = generateId();

    this.sequences[seqId] = {
      id: seqId,
      type: seqType,
      tags: new Set(),
      isBaseType: (seqType in this.baseSequenceTypes),
      blocks: [],
    };

    return seqId;
  }

  deleteSequence(seqId) {
    if (!(seqId in this.sequences)) {
      return false;
    }

    if (this.sequences[seqId].type === 'main') {
      throw new Error('Cannot delete main sequence');
    }

    if (this.sequences[seqId].type in this.baseSequenceTypes) {
      this.gcSequenceReferences('block', seqId);
    } else {
      this.gcSequenceReferences('inline', seqId);
    }
    delete this.sequences[seqId];
    this.gcSequences();
    return true;
  }

  gcSequenceReferences(seqContext, seqId) {
    const docSet = this.processor.docSets[this.docSetId];

    for (const sequence of Object.values(this.sequences)) {
      for (const block of sequence.blocks) {
        const succinct = seqContext === 'block' ? block.bg : block.c;
        let pos = 0;

        while (pos < succinct.length) {
          const [itemLength, itemType] = headerBytes(succinct, pos);

          if (itemType !== itemEnum.graft) {
            pos += itemLength;
          } else {
            const graftSeqId = succinctGraftSeqId(docSet.enums, docSet.enumIndexes, succinct, pos);

            if (graftSeqId === seqId) {
              succinct.deleteItem(pos);
            } else {
              pos += itemLength;
            }
          }
        }
      }
    }
  }

  deleteBlock(seqId, blockN) {
    if (!(seqId in this.sequences)) {
      return false;
    }

    const sequence = this.sequences[seqId];

    if (blockN < 0 || blockN >= sequence.blocks.length) {
      return false;
    }
    sequence.blocks.splice(blockN, 1);
    return true;
  }
}

module.exports = { Document };
