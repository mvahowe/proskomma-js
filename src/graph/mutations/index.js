const { GraphQLObjectType } = require('graphql');
const { tagMutations } = require('./tags');
const { deleteMutations } = require('./delete');
const { addMutations } = require('./add');
const { rehashMutations } = require('./rehash');
const { updateMutations } = require('./update');
const { versificationMutations } = require('./versification');

const {
  addMutationsSchemaString,
  addMutationsResolvers,
} = require('./add');

const {
  deleteMutationsSchemaString,
  deleteMutationsResolvers,
} = require('./delete');

const {
  rehashMutationsSchemaString,
  rehashMutationsResolvers,
} = require('./rehash');

const {
  tagMutationsSchemaString,
  tagMutationsResolvers,
} = require('./tags');

const mutationsSchemaString = `
type Mutation {
${addMutationsSchemaString}
${deleteMutationsSchemaString}
${rehashMutationsSchemaString}
${tagMutationsSchemaString}
}`;

const mutationsResolvers = {
  ...addMutationsResolvers,
  ...deleteMutationsResolvers,
  ...rehashMutationsResolvers,
  ...tagMutationsResolvers,
};

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

module.exports = {
  mutationsSchemaString,
  mutationsResolvers,
  schemaMutations,
};
