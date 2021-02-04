const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLList,
} = require('graphql');
const inputKeyValue = require('../queries/input_key_value');

const addMutations = {
  addDocument: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      selectors: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputKeyValue))) },
      contentType: { type: GraphQLNonNull(GraphQLString) },
      content: { type: GraphQLNonNull(GraphQLString) },
    },
    resolve: (root, args) => {
      const selectorsObject = {};

      args.selectors.forEach(
        s => {
          selectorsObject[s.key] = s.value;
        },
      );
      return !!root.importDocument(selectorsObject, args.contentType, args.content);
    },
  },
  newSequence: {
    type: GraphQLNonNull(GraphQLString),
    args: {
      documentId: { type: GraphQLNonNull(GraphQLString) },
      type: { type: GraphQLNonNull(GraphQLString) },
    },
    resolve: (root, args) => {
      const document = root.documents[args.documentId];

      if (!document) {
        throw new Error(`Document '${args.documentId}' not found`);
      }

      return document.newSequence(args.type);
    },
  },
};

module.exports = addMutations;
