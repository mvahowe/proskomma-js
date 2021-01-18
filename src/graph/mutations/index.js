const { GraphQLObjectType } = require('graphql');
const tagMutations = require('./tags');

const schemaMutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: { ...tagMutations },
});

module.exports = { schemaMutations };