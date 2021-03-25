const {
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
} = require('graphql');

const versificationMutations = {
  setVerseMapping: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      docSetId: { type: GraphQLNonNull(GraphQLString) },
      vrsSource: { type: GraphQLString },
      jsonSource: { type: GraphQLString },
    },
    resolve: () => {
      throw new Error('Not implemented');
    },
  },
  unsetVerseMapping: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      docSetId: { type: GraphQLNonNull(GraphQLString) },
    },
    resolve: () => {
      throw new Error('Not implemented');
    },
  },
};

module.exports = versificationMutations;