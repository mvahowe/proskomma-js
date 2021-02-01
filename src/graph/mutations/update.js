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
    resolve: (root, args) => {
      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        throw new Error(`DocSet '${args.docSetId}' not found`);
      }
      return docSet.updateItems(
        args.documentId,
        args.sequenceId,
        args.blockPosition,
        args.itemObjects,
      );
    },
  },
};

module.exports = updateMutations;