const {
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');
const {
  addTag,
  removeTag,
} = require('proskomma-utils');

const tagMutationsSchemaString = `
  """Add one or more tags to a docSet, if they are not already present"""
  addDocSetTags(
    """The id of the docSet to which the tags will be added"""
    docSetId: String!
    """A list of tags to be added"""
    tags: [String]!
  ): [String!]!
  """Add one or more tags to a document, if they are not already present"""
  addDocumentTags(
    """The id of the docSet containing the document to which the tags will be added"""
    docSetId: String!
    """The id of the document to which the tags will be added"""
    documentId: String!
    """A list of tags to be added"""
    tags: [String]!
  ): [String!]
  """Add one or more tags to a sequence, if they are not already present"""
  addSequenceTags(
    """The id of the docSet containing the document containing the sequence to which the tags will be added"""
    docSetId: String!
    """The id of the document containing the sequence to which the tags will be added"""
    documentId: String!
    """The id of the sequence to which the tags will be added"""
    sequenceId: String!
    """A list of tags to be added"""
    tags: [String]!
  ) : [String!]
  """Remove one or more tags from a docSet, if they are present"""
  removeDocSetTags(
    """The id of the docSet from which the tags will be removed"""
    docSetId: String!
    """A list of tags to be removed"""
    tags: [String]!
  ): [String!]
  """Remove one or more tags from a document, if they are present"""
  removeDocumentTags(
    """The id of the docSet containing the document from which the tags will be removed"""
    docSetId: String!
    """The id of the document from which the tags will be removed"""
    documentId: String!
    """A list of tags to be removed"""
    tags: [String]!
  ): [String!]
  """Remove one or more tags from a sequence, if they are present"""
  removeSequenceTags(
    """The id of the docSet containing the document containing the sequence from which the tags will be removed"""
    docSetId: String!
    """The id of the document containing the sequence from which the tags will be removed"""
    documentId: String!
    """The id of the sequence from which the tags will be removed"""
    sequenceId: String!
    """A list of tags to be removed"""
    tags: [String]!
  ) : [String!]
`;

const tagMutationsResolvers = {
  addDocSetTags: (root, args) => {
    const docSet = root.docSets[args.docSetId];

    for (const tag of args.tags) {
      docSet.addTag(tag);
    }
    return Array.from(docSet.tags);
  },
  addDocumentTags: (root, args) => {
    const docSet = root.docSets[args.docSetId];
    const document = docSet.processor.documents[args.documentId];

    for (const tag of args.tags) {
      document.addTag(tag);
    }
    return Array.from(document.tags);
  },
  addSequenceTags: (root, args) => {
    const docSet = root.docSets[args.docSetId];
    const document = docSet.processor.documents[args.documentId];
    const sequence = document.sequences[args.sequenceId];

    for (const tag of args.tags) {
      addTag(sequence.tags, tag);
    }
    return Array.from(sequence.tags);
  },
  removeDocSetTags: (root, args) => {
    const docSet = root.docSets[args.docSetId];

    for (const tag of args.tags) {
      docSet.removeTag(tag);
    }
    return Array.from(docSet.tags);
  },
  removeDocumentTags: (root, args) => {
    const docSet = root.docSets[args.docSetId];
    const document = docSet.processor.documents[args.documentId];

    for (const tag of args.tags) {
      document.removeTag(tag);
    }
    return Array.from(document.tags);
  },
  removeSequenceTags: (root, args) => {
    const docSet = root.docSets[args.docSetId];
    const document = docSet.processor.documents[args.documentId];
    const sequence = document.sequences[args.sequenceId];

    for (const tag of args.tags) {
      removeTag(sequence.tags, tag);
    }
    return Array.from(sequence.tags);
  },
};

const tagMutations = {
  addDocSetTags: {
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
    description: 'Add one or more tags to a docSet, if they are not already present',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet to which the tags will be added',
      },
      tags: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
        description: 'A list of tags to be added',
      },
    },
    resolve: tagMutationsResolvers.addDocSetTags,
  },
  addDocumentTags: {
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
    description: 'Add one or more tags to a document, if they are not already present',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document to which the tags will be added',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document to which the tags will be added',
      },
      tags: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
        description: 'A list of tags to be added',
      },
    },
    resolve: tagMutationsResolvers.addDocumentTags,
  },
  addSequenceTags: {
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
    description: 'Add one or more tags to a sequence, if they are not already present',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document containing the sequence to which the tags will be added',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document containing the sequence to which the tags will be added',
      },
      sequenceId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the sequence to which the tags will be added',
      },
      tags: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
        description: 'A list of tags to be added',
      },
    },
    resolve: tagMutationsResolvers.addSequenceTags,
  },
  removeDocSetTags: {
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
    description: 'Remove one or more tags from a docSet, if they are present',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet from which the tags will be removed',
      },
      tags: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
        description: 'A list of tags to be removed',
      },
    },
    resolve: tagMutationsResolvers.removeDocSetTags,
  },
  removeDocumentTags: {
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
    description: 'Remove one or more tags from a document, if they are present',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document from which the tags will be removed',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document from which the tags will be removed',
      },
      tags: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
        description: 'A list of tags to be removed',
      },
    },
    resolve: tagMutationsResolvers.removeDocumentTags,
  },
  removeSequenceTags: {
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
    description: 'Remove one or more tags from a sequence, if they are present',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet containing the document containing the sequence from which the tags will be removed',
      },
      documentId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the document containing the sequence from which the tags will be removed',
      },
      sequenceId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the sequence from which the tags will be removed',
      },
      tags: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
        description: 'A list of tags to be removed',
      },
    },
    resolve: tagMutationsResolvers.removeSequenceTags,
  },
};

module.exports = {
  tagMutationsSchemaString,
  tagMutationsResolvers,
  tagMutations,
};
