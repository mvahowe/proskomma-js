const {
  GraphQLObjectType, GraphQLString, GraphQLList, GraphQLNonNull,
} = require('graphql');
const { addTag, removeTag } = require('proskomma-utils');

const schemaMutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addDocSetTags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      args: {
        docSetId: { type: GraphQLNonNull(GraphQLString) },
        tags: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))) },
      },
      resolve: (root, args) => {
        const docSet = root.docSets[args.docSetId];

        for (const tag of args.tags) {
          docSet.addTag(tag);
        }
        return Array.from(docSet.tags);
      },
    },
    addDocumentTags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      args: {
        docSetId: { type: GraphQLNonNull(GraphQLString) },
        documentId: { type: GraphQLNonNull(GraphQLString) },
        tags: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))) },
      },
      resolve: (root, args) => {
        const docSet = root.docSets[args.docSetId];
        const document = docSet.processor.documents[args.documentId];

        for (const tag of args.tags) {
          document.addTag(tag);
        }
        return Array.from(document.tags);
      },
    },
    addSequenceTags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      args: {
        docSetId: { type: GraphQLNonNull(GraphQLString) },
        documentId: { type: GraphQLNonNull(GraphQLString) },
        sequenceId: { type: GraphQLNonNull(GraphQLString) },
        tags: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))) },
      },
      resolve: (root, args) => {
        const docSet = root.docSets[args.docSetId];
        const document = docSet.processor.documents[args.documentId];
        const sequence = document.sequences[args.sequenceId];

        for (const tag of args.tags) {
          addTag(sequence.tags, tag);
        }
        return Array.from(sequence.tags);
      },
    },
    removeDocSetTags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      args: {
        docSetId: { type: GraphQLNonNull(GraphQLString) },
        tags: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))) },
      },
      resolve: (root, args) => {
        const docSet = root.docSets[args.docSetId];

        for (const tag of args.tags) {
          docSet.removeTag(tag);
        }
        return Array.from(docSet.tags);
      },
    },
    removeDocumentTags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      args: {
        docSetId: { type: GraphQLNonNull(GraphQLString) },
        documentId: { type: GraphQLNonNull(GraphQLString) },
        tags: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))) },
      },
      resolve: (root, args) => {
        const docSet = root.docSets[args.docSetId];
        const document = docSet.processor.documents[args.documentId];

        for (const tag of args.tags) {
          document.removeTag(tag);
        }
        return Array.from(document.tags);
      },
    },
    removeSequenceTags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      args: {
        docSetId: { type: GraphQLNonNull(GraphQLString) },
        documentId: { type: GraphQLNonNull(GraphQLString) },
        sequenceId: { type: GraphQLNonNull(GraphQLString) },
        tags: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))) },
      },
      resolve: (root, args) => {
        const docSet = root.docSets[args.docSetId];
        const document = docSet.processor.documents[args.documentId];
        const sequence = document.sequences[args.sequenceId];

        for (const tag of args.tags) {
          removeTag(sequence.tags, tag);
        }
        return Array.from(sequence.tags);
      },
    },
  },
});

module.exports = { schemaMutations };