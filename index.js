const { graphql } = require('graphql');
const packageJson = require('./package.json');
const { DocSet } = require('./model/doc_set');
const { Document } = require('./model/document');
const { gqlSchema } = require('./graph');

class ProsKomma {

    constructor() {
        this.documents = {};
        this.docSetsByLang = {};
        this.docSets = {};
        this.filters = {};
        this.customTags = {
            heading: [],
            paragraph: [],
            char: [],
            word: [],
            intro: [],
            introHeading: []
        }
    }

    packageVersion() {
        return packageJson.version;
    };

    docSetList() {
        return Object.values(this.docSets);
    }

    docSetById(args) {
        return this.docSets[args.id]
    }

    nDocSets() {
        return this.docSetList().length;
    }

    nDocuments() {
        return this.documentList.length;
    }

    documentList() {
        return Object.values(this.documents);
    }

    documentById(args) {
        return this.documents[args.id]
    }

    importDocument(lang, abbr, contentType, contentString, filterOptions, customTags) {
        if (!filterOptions) {
            filterOptions = this.filters;
        }
        if (!customTags) {
            customTags = this.customTags;
        }
        const docSetId = this.findOrMakeDocSet(lang, abbr);
        let doc = new Document(this, lang, abbr, docSetId, contentType, contentString, filterOptions, customTags);
        this.addDocument(doc, docSetId);
        return doc;
    }

    addDocument(doc, docSetId) {
        this.documents[doc.id] = doc;
        this.docSets[docSetId].docIds.push(doc.id);
    }

    findOrMakeDocSet(lang, abbr) {
        if (!(lang in this.docSetsByLang)) {
            this.docSetsByLang[lang] = {};
        }
        if (!(abbr in this.docSetsByLang[lang])) {
            this.docSetsByLang[lang][abbr] = new DocSet(this, lang, abbr);
        }
        const docSet = this.docSetsByLang[lang][abbr];
        if (!(docSet.id in this.docSets)) {
            this.docSets[docSet.id] = docSet;
        }
        return this.docSetsByLang[lang][abbr].id;
    }

    async gqlQuery(query) {
        return await graphql(gqlSchema, query, this, {});
    }

    serializeSuccinct(docSetId) {
        return this.docSets[docSetId].serializeSuccinct();
    }

}

module.exports = {ProsKomma}