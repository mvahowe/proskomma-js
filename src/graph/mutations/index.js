const { GraphQLObjectType } = require('graphql');
const tagMutations = require('./tags');
const deleteMutations = require('./delete');

const schemaFields = {
  ...tagMutations,
  ...deleteMutations,
};

const schemaMutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: schemaFields,
});

module.exports = { schemaMutations };