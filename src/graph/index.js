const { GraphQLSchema } = require('graphql');

const { schemaQueries } = require('./queries/index');
const { schemaMutations } = require('./mutations/index');

const gqlSchema = new GraphQLSchema({
  query: schemaQueries,
  mutation: schemaMutations,
});

module.exports = { gqlSchema };