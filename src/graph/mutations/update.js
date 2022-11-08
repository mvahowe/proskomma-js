import { remakeBlocks } from '../lib/remake_blocks';
import PipelineHandler from 'pipeline-handler';
import pipelines from '../../pipelines/perf2x';
import customTransforms from '../../transforms';

const updateMutationsSchemaString = `
  """Replaces the items of a block with a new set of items"""
  updateItems(
    """The id of the docSet containing the document containing the sequence containing the block for which the items will be updated"""
    docSetId: String!
    """The id of the document containing the sequence containing the block for which the items will be updated"""
    documentId: String!
    """The id of the sequence containing the block for which the items will be updated (defaults to the main sequence)"""
    sequenceId: String
    """The zero-indexed number of the block for which the items will be updated"""
    blockPosition: Int!
    """The new content for the block as item objects"""
    items: [InputItemObject!]
    """BlockGrafts for the block as item objects"""
    blockGrafts: [InputItemObject!]
    """Optional blockScope for the block as an item object"""
    blockScope: InputItemObject
  ): Boolean!
  """Replaces all the blocks of a sequence with a new set of blocks"""
  updateAllBlocks(
    """The id of the docSet containing the document containing the sequence for which the blocks will be updated"""
    docSetId: String!
    """The id of the document containing the sequence for which the blocks will be updated"""
    documentId: String!
    """The id of the sequence for which the blocks will be updated (defaults to the main sequence)"""
    sequenceId: String
    """The JSON describing blocks"""
    blocksSpec: [inputBlockSpec!]!
  ): Boolean!
  """Replaces all the blocks of a sequence with a new set of blocks derived from PERF"""
  updateSequenceFromPerf(
    """The id of the docSet containing the document containing the sequence for which the blocks will be updated"""
    docSetId: String!
    """The id of the document containing the sequence for which the blocks will be updated"""
    documentId: String!
    """The id of the sequence for which the blocks will be updated (defaults to the main sequence)"""
    sequenceId: String
    """The JSON describing blocks"""
    perf: String!
  ): Boolean!
  """Garbage collects unused sequences within a document. (You probably don\\'t need to do this.)"""
  gcSequences(
    """The id of the docSet containing the document to be garbage collected"""
    docSetId: String!
    """The id of the document to be garbage collected"""
    documentId: String!
  ) : Boolean!
 
`;
const updateMutationsResolvers = {
  updateItems: (root, args) => {
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
  updateAllBlocks: (root, args) => {
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
    remakeBlocks(docSet, document, sequence, args.blocksSpec);
    document.buildChapterVerseIndex();
    return true;
  },
  updateSequenceFromPerf: async (root, args) => {
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
    const sequencePerf = JSON.parse(args.perf);
    const perf = {
      "schema": {
        "structure": "flat",
        "structure_version": "0.3.0",
        "constraints": [
          {
            "name": "perf",
            "version": "0.3.0"
          }
        ]
      },
      "metadata": {
        "translation": {
          "id": "eBible/fra_fraLSG",
          "selectors": {
            "lang": "fra",
            "abbr": "fraLSG"
          },
          "tags": [],
          "properties": {}
        },
        "document": {
          "tags": [],
          "properties": {},
          "id": "MRK MRKFLS1910.PTX, Louis Segond 1910, French, 31-10-2011, Moon Sun Kim. Updated for DBL by E. Canales, September 2012.",
          "bookCode": "MRK",
          "ide": "UTF-8",
          "h": "MARC",
          "toc": "Évangile selon Marc",
          "toc2": "Marc"
        }
      },
      sequences: {},
      main_sequence_id: args.sequenceId
    };
    perf.sequences[args.sequenceId] = sequencePerf

    let blocksSpec = {};
    try {
      const pipelineHandler = new PipelineHandler(pipelines, customTransforms, root);
      const output = await pipelineHandler.runPipeline("perf2PkJsonPipeline", { perf });
      blocksSpec =  Object.values(output.pkJson)[0];
    } catch(err) {
      console.error("pipelineHandler Error :\n", err);
      return false;
    }
    remakeBlocks(docSet, document, sequence, blocksSpec);
    document.buildChapterVerseIndex();
    return true;
  },
  gcSequences: (root, args) => {
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
};

export {
  updateMutationsSchemaString,
  updateMutationsResolvers,
};
