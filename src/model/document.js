const {
  generateId,
  nComponentsForScope,
  validateTags,
  addTag,
} = require('proskomma-utils');
const {
  parseUsfm, parseUsx, parseLexicon,
} = require('../parser/lexers');
const { Parser } = require('../parser');

class Document {
  constructor(processor, docSetId, contentType, contentString, filterOptions, customTags, emptyBlocks, tags) {
    this.id = generateId();
    this.processor = processor;
    this.docSetId = docSetId;
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

  addTag(tag) {
    addTag(this.tags, tag);
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

  succinctPass2(parser) {
    const docSet = this.processor.docSets[this.docSetId];
    this.mainId = parser.sequences.main.id;

    for (const seq of parser.allSequences()) {
      this.sequences[seq.id] = {
        id: seq.id,
        type: seq.type,
        tags: Array.from(seq.tags),
        isBaseType: (seq.type in parser.baseSequenceTypes),
        blocks: seq.succinctifyBlocks(docSet),
      };
    }
  }

  serializeSuccinct() {
    const ret = { sequences: {} };
    ret.headers = this.headers;
    ret.mainId = this.mainId;
    ret.tags = Array.from(this.tags)

    for (const [seqId, seqOb] of Object.entries(this.sequences)) {
      ret.sequences[seqId] = this.serializeSuccinctSequence(seqOb);
    }
    return ret;
  }

  serializeSuccinctSequence(seqOb) {
    const ret = {
      type: seqOb.type,
      blocks: seqOb.blocks.map(b => this.serializeSuccinctBlock(b)),
    };
    return ret;
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
}

module.exports = { Document };
