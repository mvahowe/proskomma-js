const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} = require('graphql');

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
    resolve: (root, args) =>
      root.rehashDocSet(args.docSetId),
  },
};

module.exports = rehashMutations;