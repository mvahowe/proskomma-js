const { GraphQLObjectType } = require('graphql');
const tagMutations = require('./tags');
const deleteMutations = require('./delete');
const addMutations = require('./add');
const rehashMutations = require('./rehash');
const updateMutations = require('./update');

const schemaFields = {
  ...tagMutations,
  ...deleteMutations,
  ...addMutations,
  ...rehashMutations,
  ...updateMutations,
};

const schemaMutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: schemaFields,
});

module.exports = { schemaMutations };