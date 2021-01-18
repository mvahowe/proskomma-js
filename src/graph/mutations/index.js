const { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLNonNull } = require('graphql');

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
  },
});

module.exports = { schemaMutations };