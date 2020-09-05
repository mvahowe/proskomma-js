const { generateId } = require("../generate_id");
const { Token } = require("./items");

const Block = class {

    constructor () {
        this.id = generateId();
        this.items = [];
    }

    addItem(i) {
        this.items.push(i);
    }

    plainText() {
        return this.items.filter(i => i instanceof Token).map(i => i.chars).join('');
    }

    trim() {
        this.items = this.trimEnd(this.trimStart(this.items))
    }

    trimStart(items) {
        if (items.length === 0) {
            return items;
        }
        const firstItem = items[0];
        if (["lineSpace", "eol"].includes(firstItem.itemType)) {
            return this.trimStart(items.slice(1));
        } else if (firstItem instanceof Token) {
            return items;
        } else {
            return [firstItem, ...this.trimStart(items.slice(1))];
        }
    }

    trimEnd(items) {
        if (items.length === 0) {
            return items;
        }
        const lastItem = items[items.length - 1];
        if (["lineSpace", "eol"].includes(lastItem.itemType)) {
            return this.trimEnd(items.slice(0, items.length - 1));
        } else if (lastItem instanceof Token) {
            return items;
        } else {
            return [...this.trimEnd(items.slice(0, items.length - 1)), lastItem];
        }
    }

}

module.exports = { Block };