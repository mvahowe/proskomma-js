const {
  GraphQLObjectType,
  GraphQLInt,
} = require('graphql');

const cvType = new GraphQLObjectType({
  name: 'cv',
  description: 'A chapter-verse reference',
  fields: () => ({
    chapter: {
      type: GraphQLInt,
      description: 'The chapter number',
      resolve: root => root[0],
    },
    verse: {
      type: GraphQLInt,
      description: 'The verse number',
      resolve: root => root[1],
    },
  }),
});

module.exports = {cvType};
