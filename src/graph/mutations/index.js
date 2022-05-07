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

const {
  updateMutationsSchemaString,
  updateMutationsResolvers,
} = require('./update');

const {
  versificationMutationsSchemaString,
  versificationMutationsResolvers,
} = require('./versification');

const mutationsSchemaString = `
type Mutation {
${addMutationsSchemaString}
${deleteMutationsSchemaString}
${rehashMutationsSchemaString}
${tagMutationsSchemaString}
${updateMutationsSchemaString}
${versificationMutationsSchemaString}
}`;

const mutationsResolvers = {
  ...addMutationsResolvers,
  ...deleteMutationsResolvers,
  ...rehashMutationsResolvers,
  ...tagMutationsResolvers,
  ...updateMutationsResolvers,
  ...versificationMutationsResolvers,
};


module.exports = {
  mutationsSchemaString,
  mutationsResolvers,
};
