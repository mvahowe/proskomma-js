const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} = require('graphql');

const deleteMutations = {
  deleteDocSet: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: { docSetId: { type: GraphQLNonNull(GraphQLString) } },
    resolve: (root, args) =>
      root.deleteDocSet(args.docSetId),
  },
  deleteDocument: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      docSetId: { type: GraphQLNonNull(GraphQLString) },
      documentId: { type: GraphQLNonNull(GraphQLString) },
    },
    resolve: (root, args) =>
      root.deleteDocument(args.docSetId, args.documentId),
  },
  deleteSequence: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      documentId: { type: GraphQLNonNull(GraphQLString) },
      sequenceId: { type: GraphQLNonNull(GraphQLString) },
    },
    resolve: (root, args) => {
      const document = root.documents[args.documentId];

      if (!document) {
        throw new Error(`Document '${args.documentId}' not found`);
      }

      return document.deleteSequence(args.sequenceId);
    },
  },
};

module.exports = deleteMutations;