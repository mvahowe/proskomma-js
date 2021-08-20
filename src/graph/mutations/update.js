const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
} = require('graphql');

const inputItemObject = require('../queries/inputItemObject');
const inputBlockSpecType = require('../queries/inputBlockSpec');

const updateMutations = {
  updateItems: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Replaces the items of a block with a new set of items',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document containing the sequence containing the block for which the items will be updated',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document containing the sequence containing the block for which the items will be updated',
      },
      sequenceId: {
        type: GraphQLString,
        description: 'The id of the sequence containing the block for which the items will be updated (defaults to the main sequence)',
      },
      blockPosition: {
        type: GraphQLNonNull(GraphQLInt),
        description: 'The zero-indexed number of the block for which the items will be updated',
      },
      items: {
        type: GraphQLList(GraphQLNonNull(inputItemObject)),
        description: 'The new content for the block as item objects',
      },
      blockGrafts: {
        type: GraphQLList(GraphQLNonNull(inputItemObject)),
        description: 'BlockGrafts for the block as item objects',
      },
      blockScope: {
        type: inputItemObject,
        description: 'Optional blockScope for the block as an item object',
      },
    },
    resolve: (root, args) => {
      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        throw new Error(`DocSet '${args.docSetId}' not found`);
      }

      if (!args.items) {
        throw new Error('Must provide items');
      }

      const itemsResult = docSet.updateItems(
        args.documentId,
        args.sequenceId,
        args.blockPosition,
        args.items,
      );

      if (!itemsResult) {
        return false;
      }

      if (args.blockGrafts) {
        const bgResult = docSet.updateBlockGrafts(
          args.documentId,
          args.sequenceId,
          args.blockPosition,
          args.blockGrafts,
        );

        if (!bgResult) {
          return false;
        }
      }

      if (args.blockScope) {
        const bsResult = docSet.updateBlockScope(
          args.documentId,
          args.sequenceId,
          args.blockPosition,
          args.blockScope,
        );

        if (!bsResult) {
          return false;
        }
      }
      return true;
    },
  },
  updateAllBlocks: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Replaces all the blocks of a sequence with a new set of blocks',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document containing the sequence for which the blocks will be updated',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document containing the sequence for which the blocks will be updated',
      },
      sequenceId: {
        type: GraphQLString,
        description: 'The id of the sequence for which the blocks will be updated (defaults to the main sequence)',
      },
      blocksSpec: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputBlockSpecType))),
        description: 'The JSON describing blocks',
      },
    },
    resolve: (root, args) => {
      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        throw new Error(`DocSet '${args.docSetId}' not found`);
      }

      const document = root.documents[args.documentId];

      if (!document) {
        throw new Error(`Document '${args.documentId}' not found`);
      }

      const sequence = document.sequences[args.sequenceId || document.mainId];

      if (!sequence) {
        throw new Error(`Sequence '${args.sequenceId || document.mainId}' not found`);
      }

      const nBlocks = sequence.blocks.length;

      for (let blockN = 0; blockN < nBlocks; blockN++) {
        document.deleteBlock(sequence.id, 0, false);
      }

      for (let blockN = 0; blockN < args.blocksSpec.length; blockN++) {
        const block = args.blocksSpec[blockN];
        document.newBlock(sequence.id, blockN, block.bs.payload, null, false);
        const itemsResult = docSet.updateItems(
          args.documentId,
          args.sequenceId,
          blockN,
          block.items,
        );

        if (!itemsResult) {
          return false;
        }

        const bgResult = docSet.updateBlockGrafts(
          args.documentId,
          args.sequenceId,
          blockN,
          block.bg,
        );

        if (!bgResult) {
          return false;
        }
        docSet.updateBlockIndexesAfterEdit(sequence, blockN);
      }
      document.buildChapterVerseIndex();
      return true;
    },
  },
  gcSequences: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Garbage collects unused sequences within a document. (You probably don\'t need to do this.)',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document to be garbage collected',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document to be garbage collected',
      },
    },
    resolve: (root, args) => {
      const docSet = root.docSets[args.docSetId];

      if (!docSet) {
        throw new Error(`DocSet '${args.docSetId}' not found`);
      }

      const document = root.documents[args.documentId];

      if (!document) {
        throw new Error(`Document '${args.documentId}' not found`);
      }

      if (document.gcSequences()) {
        docSet.rehash();
        return true;
      } else {
        return false;
      }
    },
  },
};

module.exports = updateMutations;
