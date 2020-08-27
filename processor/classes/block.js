const Block = class {

    constructor () {
        this.items = [];
    }

    addToken(pt) {
        this.items.push(pt);
    }

    plainText() {
        return this.items.map(i => i.printValue).join('');
    }

}

module.exports = { Block };