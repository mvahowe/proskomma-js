const sax = require("sax");
const xre = require('xregexp');

const ptClasses = require('../preTokenClasses');
const { lexingRegexes, mainRegex } = require('../lexingRegexes');
const { preTokenClassForFragment } = require("../class_for_fragment");

class UsxParser {

    constructor() {
        this.lexed = [];
        this.sax = sax.parser(true);
        this.sax.ontext = text => this.handleText(text);
        this.sax.onopentag = t => this.handleOpenTag(t);
        this.sax.onclosetag = t => this.handleCloseTag(t);
    }

    parse(str) {
        this.lexed = [];
        this.sax.write(str).close();
        return this.lexed;
    }

    handleText(text) {
        xre.match(text, mainRegex, "all")
            .map(f => preTokenClassForFragment(f, lexingRegexes))
            .forEach(t => this.lexed.push(t));
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

}

module.exports = {UsxParser}
