const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} = require('graphql');

const rehashMutationsSchemaString = `
  """Explicitly rebuild the text lookup tables for a docSet. (You probably don't need to do this)"""
  rehashDocSet(
    """The id of the docSet"""
    docSetId: String!
  ): Boolean!
`;

const rehashMutationsResolvers = {
  rehashDocSet: (root, args) =>
    root.rehashDocSet(args.docSetId),
};

const rehashMutations = {
  rehashDocSet: {
    type: GraphQLNonNull(GraphQLBoolean),
    description: 'Explicitly rebuild the text lookup tables for a docSet. (You probably don\'t need to do this)',
    args: {
      docSetId: {
        type: GraphQLNonNull(GraphQLString),
        description: 'The id of the docSet',
      },
    },
    resolve: rehashMutationsResolvers.rehashDocSet,
  },
};

module.exports = {
  rehashMutationsSchemaString,
  rehashMutationsResolvers,
  rehashMutations,
};
