import {
  addMutationsSchemaString,
  addMutationsResolvers,
} from './add';

import {
  deleteMutationsSchemaString,
  deleteMutationsResolvers,
} from './delete';

import {
  rehashMutationsSchemaString,
  rehashMutationsResolvers,
} from './rehash';

import {
  tagMutationsSchemaString,
  tagMutationsResolvers,
} from './tags';

import {
  updateMutationsSchemaString,
  updateMutationsResolvers,
} from './update';

import {
  versificationMutationsSchemaString,
  versificationMutationsResolvers,
} from './versification';

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


export {
  mutationsSchemaString,
  mutationsResolvers,
};
