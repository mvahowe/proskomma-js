const {
  GraphQLString, GraphQLNonNull, GraphQLBoolean,
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
};

module.exports = deleteMutations;