const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLList,
} = require('graphql');
const inputKeyValue = require('../queries/input_key_value');

const addMutations = {
  addDocument: {
    type: GraphQLNonNull(GraphQLBoolean),
    args: {
      selectors: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(inputKeyValue))) },
      contentType: { type: GraphQLNonNull(GraphQLString) },
      content: { type: GraphQLNonNull(GraphQLString) },
    },
    resolve: (root, args) => {
      const selectorsObject = {};

      args.selectors.forEach(
        s => {
          selectorsObject[s.key] = s.value;
        },
      );
      return !!root.importDocument(selectorsObject, args.contentType, args.content);
    },
  },
};

module.exports = addMutations;
