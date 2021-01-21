const {
  GraphQLString, GraphQLNonNull, GraphQLBoolean,
} = require('graphql');

const rehashMutations = {
  rehashDocSet: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: { docSetId: { type: GraphQLNonNull(GraphQLString) } },
    resolve: (root, args) =>
      root.rehashDocSet(args.docSetId),
  },
};

module.exports = rehashMutations;