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
        this.emptyBlocks = [];
    }

    packageVersion() {
        return packageJson.version;
    };

    docSetList() {
        return Object.values(this.docSets);
    }

    docSetsById(ids) {
        return Object.values(this.docSets).filter(ds => ids.includes(ds.id));
    }

    docSetById(id) {
        return this.docSets[id];
    }

    docSetsWithBook(bookCode) {
        const docIdsWithBook = Object.values(this.documents)
            .filter(doc => "bookCode" in doc.headers && doc.headers["bookCode"] === bookCode)
            .map(doc => doc.id);
        const docIdWithBookInDocSet = (ds) => {
            for (const docId of docIdsWithBook) {
                if (ds.docIds.includes(docId)) {
                    return true;
                }
            }
            return false;
        }
        return Object.values(this.docSets).filter(ds => docIdWithBookInDocSet(ds));
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

    documentById(id) {
        return this.documents[id];
    }

    documentsById(ids) {
        return Object.values(this.documents).filter(doc => ids.includes(doc.id));
    }

    documentsWithBook(bookCode) {
        return Object.values(this.documents).filter(doc => "bookCode" in doc.headers && doc.headers["bookCode"] === bookCode);
    }

    importDocument(lang, abbr, contentType, contentString, filterOptions, customTags, emptyBlocks) {
        return this.importDocuments(lang, abbr, contentType, [contentString], filterOptions, customTags, emptyBlocks)[0];
    }

    importDocuments(lang, abbr, contentType, contentStrings, filterOptions, customTags, emptyBlocks) {
        if (!filterOptions) {
            filterOptions = this.filters;
        }
        if (!customTags) {
            customTags = this.customTags;
        }
        if (!emptyBlocks) {
            emptyBlocks = this.emptyBlocks;
        }
        const docSetId = this.findOrMakeDocSet(lang, abbr);
        const docSet = this.docSets[docSetId];
        docSet.buildPreEnums();
        const docs = [];
        for (const contentString of contentStrings) {
            let doc = new Document(this, lang, abbr, docSetId, contentType, contentString, filterOptions, customTags, emptyBlocks);
            this.addDocument(doc, docSetId);
            docs.push(doc);
        }
        docSet.preEnums = {};
        return docs;
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