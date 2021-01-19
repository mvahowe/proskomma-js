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
};

module.exports = deleteMutations;