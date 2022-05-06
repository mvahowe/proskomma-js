const { GraphQLSchema } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const { schemaQueries } = require('./queries/index');
const { schemaMutations } = require('./mutations/index');

const {
  keyValueSchemaString,
  keyValueResolvers,
} = require('./queries/key_value');
const {
  cvSchemaString,
  cvResolvers,
} = require('./queries/cv');
const {
  idPartsSchemaString,
  idPartsResolvers,
} = require('./queries/idParts');
const { inputAttSpecSchemaString } = require('./queries/input_att_spec');
const { keyMatchesSchemaString } = require('./queries/input_key_matches');
const { inputKeyValueSchemaString } = require('./queries/input_key_value');
const { keyValuesSchemaString } = require('./queries/input_key_values');
const { inputItemObjectSchemaString } = require('./queries/inputItemObject');
const {
  itemSchemaString,
  itemResolvers,
} = require('./queries/item');
const {
  itemGroupSchemaString,
  itemGroupResolvers,
} = require('./queries/itemGroup');
const {
  kvEntrySchemaString,
  kvEntryResolvers,
} = require('./queries/kv_entry');
const {
  regexIndexSchemaString,
  regexIndexResolvers,
} = require('./queries/regex_index');
const { rowEqualsSpecSchemaString } = require('./queries/row_equals_spec');
const { rowMatchSpecSchemaString } = require('./queries/row_match_spec');
const { verseRangeSchemaString } = require('./queries/verseRange');
const { origSchemaString } = require('./queries/orig');
const {
  verseNumberSchemaString,
  verseNumberResolvers,
} = require('./queries/verseNumber');
const {
  cellSchemaString,
  cellResolvers,
} = require('./queries/cell');
const {
  cIndexSchemaString,
  cIndexResolvers,
} = require('./queries/cIndex');
const {
  cvVerseElementSchemaString,
  cvVerseElementResolvers,
} = require('./queries/cvVerseElement');
const { cvVersesSchemaString } = require('./queries/cvVerses');
const {
  cvIndexSchemaString,
  cvIndexResolvers,
} = require('./queries/cvIndex');
const {
  cvNavigationSchemaString,
  cvNavigationResolvers,
} = require('./queries/cvNavigation');
const { inputBlockSpecSchemaString } = require('./queries/inputBlockSpec');
const {
  nodeSchemaString,
  nodeResolvers,
} = require('./queries/node');
const {
  kvSequenceSchemaString,
  kvSequenceResolvers,
} = require('./queries/kv_sequence');
const {
  tableSequenceSchemaString,
  tableSequenceResolvers,
} = require('./queries/table_sequence');
const {
  treeSequenceSchemaString,
  treeSequenceResolvers,
} = require('./queries/tree_sequence');
const {
  blockSchemaString,
  blockResolvers,
} = require('./queries/block');
const {
  sequenceSchemaString,
  sequenceResolvers,
} = require('./queries/sequence');
const {
  documentSchemaString,
  documentResolvers,
} = require('./queries/document');
const {
  docSetSchemaString,
  docSetResolvers,
} = require('./queries/doc_set');
const {
  querySchemaString,
  queryResolvers,
} = require('./queries/index');
const {
  selectorSpecSchemaString,
  selectorSpecResolvers,
} = require('./queries/selector_spec');
const {
  mutationsSchemaString,
  mutationsResolvers,
} = require('./mutations/index');

const combinedSchema = `
      ${querySchemaString}
      ${mutationsSchemaString}
      ${keyValueSchemaString}
      ${cvSchemaString}
      ${idPartsSchemaString}
      ${inputAttSpecSchemaString}
      ${keyMatchesSchemaString}
      ${inputKeyValueSchemaString}
      ${keyValuesSchemaString}
      ${inputItemObjectSchemaString}
      ${itemSchemaString}
      ${itemGroupSchemaString}
      ${kvEntrySchemaString}
      ${regexIndexSchemaString}
      ${rowEqualsSpecSchemaString}
      ${rowMatchSpecSchemaString}
      ${verseRangeSchemaString}
      ${origSchemaString}
      ${verseNumberSchemaString}
      ${cellSchemaString}
      ${cIndexSchemaString}
      ${cvVerseElementSchemaString}
      ${cvVersesSchemaString}
      ${cvIndexSchemaString}
      ${cvNavigationSchemaString}
      ${inputBlockSpecSchemaString}
      ${nodeSchemaString}
      ${kvSequenceSchemaString}
      ${tableSequenceSchemaString}
      ${treeSequenceSchemaString}
      ${blockSchemaString}
      ${sequenceSchemaString}
      ${documentSchemaString}
      ${docSetSchemaString}
      ${selectorSpecSchemaString}
  `;
// console.log(combinedSchema);
const executableSchema =
  makeExecutableSchema({
    typeDefs: combinedSchema,
    resolvers: {
      Mutation: mutationsResolvers,
      Query: queryResolvers,
      KeyValue: keyValueResolvers,
      cv: cvResolvers,
      idParts: idPartsResolvers,
      Item: itemResolvers,
      ItemGroup: itemGroupResolvers,
      kvEntry: kvEntryResolvers,
      regexIndex: regexIndexResolvers,
      verseNumber: verseNumberResolvers,
      cell: cellResolvers,
      cIndex: cIndexResolvers,
      cvVerseElement: cvVerseElementResolvers,
      cvIndex: cvIndexResolvers,
      cvNavigation: cvNavigationResolvers,
      node: nodeResolvers,
      kvSequence: kvSequenceResolvers,
      tableSequence: tableSequenceResolvers,
      treeSequence: treeSequenceResolvers,
      Block: blockResolvers,
      Sequence: sequenceResolvers,
      Document: documentResolvers,
      DocSet: docSetResolvers,
      selectorSpec: selectorSpecResolvers,
    },
  });

const gqlSchema = new GraphQLSchema({
  query: schemaQueries,
  mutation: schemaMutations,
});

module.exports = { gqlSchema };
