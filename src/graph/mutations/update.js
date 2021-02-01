const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
} = require('graphql');

const inputItemObject = require('../queries/inputItemObject');

const updateMutations = {
  updateItems: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      docSetId: { type: GraphQLNonNull(GraphQLString) },
      documentId: { type: GraphQLNonNull(GraphQLString) },
      sequenceId: { type: GraphQLNonNull(GraphQLString) },
      blockPosition: { type: GraphQLNonNull(GraphQLInt) },
      itemObjects: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputItemObject))) },
    },
    resolve: (root, args) =>
      root.updateItems(
        args.docSetId,
        args.documentId,
        args.sequenceId,
        args.blockPosition,
        args.itemObjects),
  },
};

module.exports = updateMutations;