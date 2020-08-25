const lexer = require('./lexer');

class ProsKomma {

    constructor() {
        this.document = {};
        this.documentByLang = {};
        this.docSets = {};
    }

    importDocument(lang, abbr, usfmString) {
        return [];
    }

}

module.exports = {ProsKomma}