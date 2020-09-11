const sax = require("sax");

class UsxParser {

    constructor() {
        this.lexed = [];
        this.sax = sax.parser(true);
        this.sax.ontext = t => this.handleText(t);
        this.sax.onopentag = t => this.handleOpenTag(t);
        this.sax.onclosetag = t => this.handleCloseTag(t);
    }

    handleText(t) {
        console.log(t);
    }

    handleOpenTag(t) {
        const name = t.name;
        const atts = t.attributes
        console.log(`<${name} ${this.printAtts(t.attributes)}>`);
    }

    printAtts(atts) {
        return Object.entries(atts).map(kv => ` ${kv[0]}="${kv[1]}"`).join("");
    }

    handleCloseTag(t) {
        console.log(`</${t}>`);
    }

    parse(str) {
        this.lexed = [];
        this.sax.write(str).close();
        return this.lexed;
    }
}

module.exports = { UsxParser }
