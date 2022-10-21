import utils from "../../util";
import { Sequence } from './sequence';

const Block = class {
  constructor(blockScope) {
    this.id = utils.generateId();
    this.items = [];
    this.bg = [];
    this.bs = {
      type: 'scope',
      subType: 'start',
      payload: blockScope,
    };
    this.os = [];
  }

  addItem(i) {
    this.items.push(i);
  }

  plainText() {
    return this.items.filter(i => i.type === 'token').map(i => i.payload).join('');
  }

  trim() {
    this.items = this.trimEnd(this.trimStart(this.items));
  }

  reorderSpanWithAtts() {
    const swaStarts = [];

    for (const [pos, item] of this.items.entries()) {
      if (item.subType === 'start' && item.payload.startsWith('spanWithAtts')) {
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

        if (item.type === 'token') {
          tokens.push(item);
        } else if (item.subType === 'start' && item.payload.startsWith('attribute/spanWithAtts')) {
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
      if (item.subType === 'end' && ['inline/f', 'inline/fe', 'inline/x'].includes(item.payload)) {
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
    const noteStarts = [];

    for (const [pos, item] of this.items.entries()) {
      if (item.subType === 'start' && (item.payload.startsWith('inline/f') || item.payload.startsWith('inline/x'))) {
        noteStarts.push(pos);
      }
    }

    for (const noteStart of noteStarts) {
      const noteLabel = this.items[noteStart].payload;
      const callerToken = this.items[noteStart + 1];

      if (callerToken.type === 'token' && callerToken.payload.length === 1) {
        const callerSequence = new Sequence('noteCaller');
        callerSequence.newBlock(noteLabel);
        callerSequence.addItem(callerToken);
        parser.sequences.noteCaller.push(callerSequence);
        this.items[noteStart + 1] = {
          type: 'graft',
          subType: 'noteCaller',
          payload: callerSequence.id,
        };
      }
    }
  }

  trimStart(items) {
    if (items.length === 0) {
      return items;
    }

    const firstItem = items[0];

    if (['lineSpace', 'eol'].includes(firstItem.subType)) {
      return this.trimStart(items.slice(1));
    }

    if (firstItem.type === 'token') {
      return items;
    }
    return [firstItem, ...this.trimStart(items.slice(1))];
  }

  trimEnd(items) {
    if (items.length === 0) {
      return items;
    }

    const lastItem = items[items.length - 1];

    if (['lineSpace', 'eol'].includes(lastItem.subType)) {
      return this.trimEnd(items.slice(0, items.length - 1));
    }

    if (lastItem.type === 'token') {
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
        ret.push(item.payload);
      } else {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.items.splice(pos - count, 1);
    }
    toRemove = [];

    for (const [pos, item] of this.bg.entries()) {
      if (this.graftPassesOptions(item, options)) {
        ret.push(item.payload);
      } else {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.bg.splice(pos - count, 1);
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
      (!('includeGrafts' in options) || options.includeGrafts.includes(item.subType)) &&
      (!('excludeGrafts' in options) || !options.excludeGrafts.includes(item.subType))
    );
  }

  scopePassesOptions(item, options) {
    return (
      (!('includeScopes' in options) || this.scopeMatchesOptionArray(item.payload, options.includeScopes)) &&
      (!('excludeScopes' in options) || !this.scopeMatchesOptionArray(item.payload, options.excludeScopes))
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
      if (emptySequences.includes(item.payload)) {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.items.splice(pos - count, 1);
    }
    toRemove = [];

    for (const [pos, item] of this.bg.entries()) {
      if (emptySequences.includes(item.payload)) {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.bg.splice(pos - count, 1);
    }
    return ret;
  }

  grafts() {
    return Array.from(this.items.entries()).filter(ip => ip[1].type === 'graft');
  }

  scopes() {
    return Array.from(this.items.entries()).filter(ip => ip[1].type === 'scope');
  }

  tokens() {
    return Array.from(this.items.entries()).filter(ip => !['scope', 'graft'].includes(ip[1].type));
  }

  text() {
    return this.tokens().map(t => t[1].payload).join('');
  }
};

export { Block };
