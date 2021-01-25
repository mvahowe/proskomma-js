const { generateId } = require('proskomma-utils');
const {
  Token,
  Scope,
  Graft,
} = require('./items');

const Block = class {
  constructor(blockScope) {
    this.id = generateId();
    this.items = [];
    this.blockGrafts = [];
    this.blockScope = new Scope('start', blockScope);
    this.openScopes = [];
  }

  addItem(i) {
    this.items.push(i);
  }

  plainText() {
    return this.items.filter(i => i instanceof Token).map(i => i.chars).join('');
  }

  trim() {
    this.items = this.trimEnd(this.trimStart(this.items));
  }

  reorderSpanWithAtts() {
    const swaStarts = [];

    for (const [pos, item] of this.items.entries()) {
      if (item.itemType === 'startScope' && item.label.startsWith('spanWithAtts')) {
        swaStarts.push(pos + 1);
      }
    }

    for (const swaStart of swaStarts) {
      let pos = swaStart;
      let tokens = [];
      let scopes = [];

      while (true) {
        if (pos >= this.items.length) {
          break;
        }

        const item = this.items[pos];

        if (item instanceof Token) {
          tokens.push(item);
        } else if (item.itemType === 'startScope' && item.label.startsWith('attribute/spanWithAtts')) {
          scopes.push(item);
        } else {
          break;
        }
        pos++;
      }

      if (tokens.length !== 0 && scopes.length !== 0) {
        let pos = swaStart;

        for (const s of scopes) {
          this.items[pos] = s;
          pos++;
        }

        for (const t of tokens) {
          this.items[pos] = t;
          pos++;
        }
      }
    }
  }

  inlineToEnd() {
    let toAppend = null;

    for (const [pos, item] of this.items.entries()) {
      if (item.itemType === 'endScope' && ['inline/f', 'inline/fe', 'inline/x'].includes(item.label)) {
        toAppend = item;
        this.items.splice(pos, 1);
        break;
      }
    }

    if (toAppend) {
      this.addItem(toAppend);
    }
  }

  makeNoteGrafts(parser) {
    const { Sequence } = require('./sequence');
    const noteStarts = [];

    for (const [pos, item] of this.items.entries()) {
      if (item.itemType === 'startScope' && item.label.startsWith('inline/f')) {
        noteStarts.push(pos);
      }
    }

    for (const noteStart of noteStarts) {
      const noteLabel = this.items[noteStart].label;
      const callerToken = this.items[noteStart + 1];

      if (callerToken instanceof Token && callerToken.chars.length === 1) {
        const callerSequence = new Sequence('noteCaller');
        callerSequence.newBlock(noteLabel);
        callerSequence.addItem(callerToken);
        parser.sequences.noteCaller.push(callerSequence);
        this.items[noteStart + 1] = new Graft('noteCaller', callerSequence.id);
      }
    }
  }

  trimStart(items) {
    if (items.length === 0) {
      return items;
    }

    const firstItem = items[0];

    if (['lineSpace', 'eol'].includes(firstItem.itemType)) {
      return this.trimStart(items.slice(1));
    }

    if (firstItem instanceof Token) {
      return items;
    }
    return [firstItem, ...this.trimStart(items.slice(1))];
  }

  trimEnd(items) {
    if (items.length === 0) {
      return items;
    }

    const lastItem = items[items.length - 1];

    if (['lineSpace', 'eol'].includes(lastItem.itemType)) {
      return this.trimEnd(items.slice(0, items.length - 1));
    }

    if (lastItem instanceof Token) {
      return items;
    }
    return [...this.trimEnd(items.slice(0, items.length - 1)), lastItem];
  }

  filterGrafts(options) {
    // Each graft should be removed or returned
    const ret = [];
    let toRemove = [];

    for (const [pos, item] of this.grafts()) {
      if (this.graftPassesOptions(item, options)) {
        ret.push(item.seqId);
      } else {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.items.splice(pos - count, 1);
    }
    toRemove = [];

    for (const [pos, item] of this.blockGrafts.entries()) {
      if (this.graftPassesOptions(item, options)) {
        ret.push(item.seqId);
      } else {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.blockGrafts.splice(pos - count, 1);
    }
    return ret;
  }

  filterScopes(options) {
    const toRemove = [];

    for (const [pos, item] of this.scopes()) {
      if (!this.scopePassesOptions(item, options)) {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.items.splice(pos - count, 1);
    }
  }

  graftPassesOptions(item, options) {
    return (
      (!('includeGrafts' in options) || options.includeGrafts.includes(item.graftType)) &&
      (!('excludeGrafts' in options) || !options.excludeGrafts.includes(item.graftType))
    );
  }

  scopePassesOptions(item, options) {
    return (
      (!('includeScopes' in options) || this.scopeMatchesOptionArray(item.label, options.includeScopes)) &&
      (!('excludeScopes' in options) || !this.scopeMatchesOptionArray(item.label, options.excludeScopes))
    );
  }

  scopeMatchesOptionArray(itemString, optionArray) {
    for (const optionString of optionArray) {
      if (itemString.startsWith(optionString)) {
        return true;
      }
    }
    return false;
  }

  removeGraftsToEmptySequences(emptySequences) {
    const ret = [];
    let toRemove = [];

    for (const [pos, item] of this.grafts()) {
      if (emptySequences.includes(item.seqId)) {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.items.splice(pos - count, 1);
    }
    toRemove = [];

    for (const [pos, item] of this.blockGrafts.entries()) {
      if (emptySequences.includes(item.seqId)) {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.blockGrafts.splice(pos - count, 1);
    }
    return ret;
  }

  grafts() {
    return Array.from(this.items.entries()).filter(ip => ip[1].itemType === 'graft');
  }

  scopes() {
    return Array.from(this.items.entries()).filter(ip => ip[1].itemType.endsWith('Scope'));
  }

  tokens() {
    return Array.from(this.items.entries()).filter(ip => !['startScope', 'endScope', 'graft'].includes(ip[1].itemType));
  }

  text() {
    return this.tokens().map(t => t[1].chars).join('');
  }
};

module.exports = { Block };