const {
  GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull,
} = require('graphql');

const docSetType = require('./doc_set');
const documentType = require('./document');
const inputKeyValueType = require('./input_key_value');
const selectorSpecType = require('./selector_spec');

const schemaQueries = new GraphQLObjectType({
  name: 'Root',
  fields: {
    processor: { type: GraphQLNonNull(GraphQLString) },
    packageVersion: { type: GraphQLNonNull(GraphQLString) },
    selectors: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(selectorSpecType))),
      resolve: root => root.selectors,
    },
    nDocSets: { type: GraphQLNonNull(GraphQLInt) },
    docSets: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(docSetType))),
      args: {
        ids: { type: GraphQLList(GraphQLNonNull(GraphQLString)) },
        withSelectors: { type: GraphQLList(GraphQLNonNull(inputKeyValueType)) },
        withBook: { type: GraphQLString },
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
      args: { id: { type: GraphQLNonNull(GraphQLString) } },
      resolve: (root, args) => root.docSetById(args.id),
    },
    nDocuments: { type: GraphQLNonNull(GraphQLInt) },
    documents: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(documentType))),
      args: {
        ids: { type: GraphQLList(GraphQLNonNull(GraphQLString)) },
        withBook: { type: GraphQLString },
      },
      resolve: (root, args) => {
        const documentValues = args.withBook ? root.documentsWithBook(args.withBook) : root.documentList();
        return documentValues.filter(d => !args.ids || args.ids.includes(d.id));
      },
    },
    document: {
      type: documentType,
      args: { id: { type: GraphQLNonNull(GraphQLString) } },
      resolve: (root, args) => root.documentById(args.id),
    },
  },
});

module.exports = { schemaQueries };