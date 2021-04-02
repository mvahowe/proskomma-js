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

        const docSetValues = ('withBook' in args ? root.docSetsWithBook(args.withBook) : Object.values(root.docSets))
          .filter(ds => !args.ids || args.ids.includes(ds.id));

        if (args.withSelectors) {
          return docSetValues.filter(ds => docSetMatchesSelectors(ds, args.withSelectors));
        } else {
          return docSetValues;
        }
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
          description: 'Only return docSets containing a document with the specified bookCode',
        },
      },
      resolve: (root, args) => {
        const documentValues = args.withBook ? root.documentsWithBook(args.withBook) : root.documentList();
        return documentValues.filter(d => !args.ids || args.ids.includes(d.id));
      },
    },
    document: {
      type: documentType,
      description: 'The document with the specified id',
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The id of the document',
        },
      },
      resolve: (root, args) => root.documentById(args.id),
    },
  },
});

module.exports = { schemaQueries };