const { GraphQLObjectType } = require('graphql');
const tagMutations = require('./tags');
const deleteMutations = require('./delete');
const addMutations = require('./add');
const rehashMutations = require('./rehash');
const updateMutations = require('./update');
const versificationMutations = require('./versification');

const schemaFields = {
  ...tagMutations,
  ...deleteMutations,
  ...addMutations,
  ...rehashMutations,
  ...updateMutations,
  ...versificationMutations,
};

const schemaMutations = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Operations that change the state of Proskomma',
  fields: schemaFields,
});

module.exports = { schemaMutations };