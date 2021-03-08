const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} = require('graphql');

const sequenceType = require('./sequence');
const keyValueType = require('./key_value');
const cvIndexType = require('./cvIndex');
const cIndexType = require('./cIndex');

const headerById = (root, id) =>
  (id in root.headers) ? root.headers[id] : null;

const documentType = new GraphQLObjectType({
  name: 'Document',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLString) },
    docSetId: { type: GraphQLNonNull(GraphQLString) },
    headers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(keyValueType))),
      resolve: root => Object.entries(root.headers),
    },
    header: {
      type: GraphQLString,
      args: { id: { type: GraphQLNonNull(GraphQLString) } },
      resolve: (root, args) => headerById(root, args.id),
    },
    mainSequence: {
      type: GraphQLNonNull(sequenceType),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return root.sequences[root.mainId];
      },

    },
    nSequences: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return Object.keys(root.sequences).length;
      },
    },
    sequences: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(sequenceType))),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        return Object.values(root.sequences);
      },
    },
    tags: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      resolve: root => Array.from(root.tags),
    },
    hasTag: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: { tagName: { type: GraphQLNonNull(GraphQLString) } },
      resolve: (root, args) => root.tags.has(args.tagName),
    },
    cvIndexes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(cvIndexType))),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return Object.entries(root.chapterVerseIndexes());
      },
    },
    cvIndex: {
      type: GraphQLNonNull(cvIndexType),
      args: { chapter: { type: GraphQLNonNull(GraphQLInt) } },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return [args.chapter, root.chapterVerseIndex(args.chapter) || []];
      },
    },
    cIndexes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(cIndexType))),
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        return Object.entries(root.chapterIndexes());
      },
    },
    cIndex: {
      type: GraphQLNonNull(cIndexType),
      args: { chapter: { type: GraphQLNonNull(GraphQLInt) } },
      resolve: (root, args, context) => {
        context.docSet = root.processor.docSets[root.docSetId];
        context.doc = root;
        const ci = root.chapterIndex(args.chapter);
        return [args.chapter, ci || {}];
      },
    },
  }),
});

module.exports = documentType;
