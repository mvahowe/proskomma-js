const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

const docSetType = require('./doc_set');
const documentType = require('./document');
const inputKeyValueType = require('./input_key_value');
const selectorSpecType = require('./selector_spec');
const diffRecordType = require('./diff_record');

const schemaQueries = new GraphQLObjectType({
  name: 'Query',
  description: 'The top level of Proskomma queries',
  fields: {
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The id of the processor, which is different for each Proskomma instance',
      resolve: root => root.processorId,
    },
    processor: {
      type: GraphQLNonNull(GraphQLString),
      description: 'A string describing the processor class',
    },
    packageVersion: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The NPM package version',
    },
    selectors: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(selectorSpecType))),
      description: 'The selectors used to define docSets',
      resolve: root => root.selectors,
    },
    nDocSets: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of docSets',
    },
    docSets: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(docSetType))),
      description: 'The docSets in the processor',
      args: {
        ids: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'A whitelist of ids of docSets to include',
        },
        withSelectors: {
          type: GraphQLList(GraphQLNonNull(inputKeyValueType)),
          description: 'Only return docSets that match the list of selector values',
        },
        withBook: {
          type: GraphQLString,
          description: 'Only return docSets containing a document with the specified bookCode',
        },
        withTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return docSets with all the specified tags',
        },
        withoutTags: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'Only return docSets with none of the specified tags',
        },
      },
      resolve: (root, args) => {
        const docSetMatchesSelectors = (ds, selectors) => {
          for (const selector of selectors) {
            if (ds.selectors[selector.key].toString() !== selector.value) {
              return false;
            }
          }
          return true;
        };

        let ret = ('withBook' in args ? root.docSetsWithBook(args.withBook) : Object.values(root.docSets))
          .filter(ds => !args.ids || args.ids.includes(ds.id));

        if (args.withSelectors) {
          ret = ret.filter(ds => docSetMatchesSelectors(ds, args.withSelectors));
        }

        if (args.withTags) {
          ret = ret.filter(ds => args.withTags.filter(t => ds.tags.has(t)).length === args.withTags.length);
        }

        if (args.withoutTags) {
          ret = ret.filter(ds => args.withoutTags.filter(t => ds.tags.has(t)).length === 0);
        }

        return ret;
      },
    },
    docSet: {
      type: docSetType,
      description: 'The docSet with the specified id',
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The id of the docSet',
        },
      },
      resolve: (root, args) => root.docSetById(args.id),
    },
    nDocuments: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of documents in the processor',
    },
    documents: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(documentType))),
      description: 'The documents in the processor',
      args: {
        ids: {
          type: GraphQLList(GraphQLNonNull(GraphQLString)),
          description: 'A whitelist of ids of documents to include',
        },
        withBook: {
          type: GraphQLString,
          description: 'Only return documents with the specified bookCode',
        },
        withHeaderValues: {
          type: GraphQLList(GraphQLNonNull(inputKeyValueType)),
          description: 'Only return documents with the specified header key/values',
        },
      },
      resolve: (root, args) => {
        const headerValuesMatch = (docHeaders, requiredHeaders) => {
          for (const requiredHeader of requiredHeaders || []) {
            if (!(requiredHeader.key in docHeaders) || docHeaders[requiredHeader.key] !== requiredHeader.value) {
              return false;
            }
          }
          return true;
        };

        let ret = args.withBook ? root.documentsWithBook(args.withBook) : root.documentList();
        ret = ret.filter(d => !args.ids || args.ids.includes(d.id));

        if (args.withHeaderValues) {
          ret = ret.filter(d => headerValuesMatch(d.headers, args.withHeaderValues));
        }
        return ret;
      },
    },
    document: {
      type: documentType,
      description: 'The document with the specified id, or the specified docSet and withBook',
      args: {
        id: {
          type: GraphQLString,
          description: 'The id of the document',
        },
        docSetId: {
          type: GraphQLString,
          description: 'The docSet of the document (use with withBook)',
        },
        withBook: {
          type: GraphQLString,
          description: 'The book of the document (use with docSetId)',
        },
      },
      resolve: (root, args) => {
        if (args.id && !args.docSetId && !args.withBook) {
          return root.documentById(args.id);
        } else if (!args.id && args.docSetId && args.withBook) {
          return root.documentsWithBook(args.withBook).filter(d => d.docSetId === args.docSetId)[0];
        } else {
          throw new Error('document requires either id or both docSetId and withBooks (but not all three)');
        }
      },
    },
    diff: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(diffRecordType))),
      args: {
        document1: { type: GraphQLNonNull(GraphQLString) },
        document2: { type: GraphQLNonNull(GraphQLString) },
        mode: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, args) => {
        if (args.document1 === args.document2) {
          throw new Error('document1 and document2 should not be equal');
        }

        if (!['words', 'tokens'].includes(args.mode)) {
          throw new Error(`mode should be 'words' or 'tokens', not '${args.mode}'`);
        }

        if (!(args.document1 in root.documents)) {
          throw new Error(`document1 id '${args.document1}' does not exist`);
        }

        if (!(args.document2 in root.documents)) {
          throw new Error(`document2 id '${args.document2}' does not exist`);
        }

        const docSet1 = root.docSets[root.documents[args.document1].docSetId];
        docSet1.maybeBuildEnumIndexes();

        if (!docSet1) {
          throw new Error(`No docSet for document '${args.document1}'`);
        }

        const docSet2 = root.docSets[root.documents[args.document2].docSetId];
        docSet1.maybeBuildEnumIndexes();

        if (!docSet2) {
          throw new Error(`No docSet for document '${args.document2}'`);
        }

        const doc1 = root.documents[args.document1];
        const doc2 = root.documents[args.document2];
        const doc1Indexes = doc1.chapterVerseIndexes();
        const doc2Indexes = doc2.chapterVerseIndexes();
        const diffRecords = [];

        for (const [chapterN, chapter1Index] of Object.entries(doc1Indexes)) {
          if (!(chapterN in doc2Indexes)) { // Removed chapter
            diffRecords.push([chapterN, null, 'removedChapter', null, null]);
            continue;
          }

          const chapter2Index = doc2Indexes[chapterN];

          for (const verseN of [...chapter1Index.entries()].map(e => e[0])) {
            if ((chapter1Index[verseN].length > 0) && (verseN >= chapter2Index.length || chapter2Index[verseN].length === 0)) { // removed verse
              const doc1Items = docSet1.itemsByIndex(doc1.sequences[doc1.mainId], chapter1Index[verseN][0])
                .reduce((a, b) => a.concat([b]), [])
                .reduce((a, b) => a.concat(b), []);
              diffRecords.push([chapterN, verseN, 'removedVerse', doc1Items, null]);
              continue;
            }

            if ((chapter1Index[verseN].length === 0) && (chapter2Index[verseN].length > 0)) { // added Verse
              const doc2Items = docSet2.itemsByIndex(doc2.sequences[doc2.mainId], chapter2Index[verseN][0])
                .reduce((a, b) => a.concat([b]), [])
                .reduce((a, b) => a.concat(b), []);
              diffRecords.push([chapterN, verseN, 'addedVerse', null, doc2Items]);
              continue;
            }

            const doc1Items = docSet1
              .itemsByIndex(doc1.sequences[doc1.mainId], chapter1Index[verseN][0])
              .reduce((a, b) => a.concat([b]), [])
              .reduce((a, b) => a.concat(b), []);
            const doc2Items = docSet2
              .itemsByIndex(doc2.sequences[doc2.mainId], chapter2Index[verseN][0])
              .reduce((a, b) => a.concat([b]), [])
              .reduce((a, b) => a.concat(b), []);
            let doc1Tokens = doc1Items.filter(i => i[0] === 'token');
            let doc2Tokens = doc2Items.filter(i => i[0] === 'token');
            let doc1Text;
            let doc2Text;

            if (args.mode === 'words') {
              doc1Tokens = doc1Tokens.filter(t => t[1] === 'wordLike');
              doc2Tokens = doc2Tokens.filter(t => t[1] === 'wordLike');
              doc1Text = doc1Tokens.map(t => t[2]).join(' ');
              doc2Text = doc2Tokens.map(t => t[2]).join(' ');
            } else {
              doc1Text = doc1Tokens.map(t => t[1] === 'lineSpace' ? ' ' : t[2]).join('');
              doc2Text = doc2Tokens.map(t => t[1] === 'lineSpace' ? ' ' : t[2]).join('');
            }

            if (doc1Text !== doc2Text) {
              diffRecords.push([chapterN, verseN, 'changedVerse', doc1Items, doc2Items]);
            }
          }

          if (chapter2Index.length > chapter1Index.length) { // Extra verses at end of doc2
            for (const v of [...Array(chapter2Index.length - chapter1Index.length).keys()].map(i => i + chapter1Index.length)) {
              diffRecords.push([chapterN, v, 'addedVerse', null, null]);
            }
          }
        }

        for (const doc2Key of Object.keys(doc2Indexes)) {
          if (!(doc2Key in doc1Indexes)) { // Added chapters
            diffRecords.push([doc2Key, null, 'addedChapter', null, null]);
          }
        }
        return diffRecords;
      },
    },
  },
});

module.exports = { schemaQueries };