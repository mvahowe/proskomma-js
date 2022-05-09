import {
  keyValueSchemaString,
  keyValueResolvers,
} from './queries/key_value';
import {
  cvSchemaString,
  cvResolvers,
} from './queries/cv';
import {
  idPartsSchemaString,
  idPartsResolvers,
} from './queries/idParts';
import { inputAttSpecSchemaString } from './queries/input_att_spec';
import { keyMatchesSchemaString } from './queries/input_key_matches';
import { inputKeyValueSchemaString } from './queries/input_key_value';
import { keyValuesSchemaString } from './queries/input_key_values';
import { inputItemObjectSchemaString } from './queries/inputItemObject';
import {
  itemSchemaString,
  itemResolvers,
} from './queries/item';
import {
  itemGroupSchemaString,
  itemGroupResolvers,
} from './queries/itemGroup';
import {
  kvEntrySchemaString,
  kvEntryResolvers,
} from './queries/kv_entry';
import {
  regexIndexSchemaString,
  regexIndexResolvers,
} from './queries/regex_index';
import { rowEqualsSpecSchemaString } from './queries/row_equals_spec';
import { rowMatchSpecSchemaString } from './queries/row_match_spec';
import { verseRangeSchemaString } from './queries/verseRange';
import { origSchemaString } from './queries/orig';
import {
  verseNumberSchemaString,
  verseNumberResolvers,
} from './queries/verseNumber';
import {
  cellSchemaString,
  cellResolvers,
} from './queries/cell';
import {
  cIndexSchemaString,
  cIndexResolvers,
} from './queries/cIndex';
import {
  cvVerseElementSchemaString,
  cvVerseElementResolvers,
} from './queries/cvVerseElement';
import {
  cvVersesSchemaString,
  cvVersesResolvers,
} from './queries/cvVerses';
import {
  cvIndexSchemaString,
  cvIndexResolvers,
} from './queries/cvIndex';
import {
  cvNavigationSchemaString,
  cvNavigationResolvers,
} from './queries/cvNavigation';
import { inputBlockSpecSchemaString } from './queries/inputBlockSpec';
import {
  nodeSchemaString,
  nodeResolvers,
} from './queries/node';
import {
  kvSequenceSchemaString,
  kvSequenceResolvers,
} from './queries/kv_sequence';
import {
  tableSequenceSchemaString,
  tableSequenceResolvers,
} from './queries/table_sequence';
import {
  treeSequenceSchemaString,
  treeSequenceResolvers,
} from './queries/tree_sequence';
import {
  blockSchemaString,
  blockResolvers,
} from './queries/block';
import {
  sequenceSchemaString,
  sequenceResolvers,
} from './queries/sequence';
import {
  documentSchemaString,
  documentResolvers,
} from './queries/document';
import {
  docSetSchemaString,
  docSetResolvers,
} from './queries/doc_set';
import {
  querySchemaString,
  queryResolvers,
} from './queries/index';
import {
  selectorSpecSchemaString,
  selectorSpecResolvers,
} from './queries/selector_spec';
import { inputSelectorSpecSchemaString } from './queries/input_selector_spec';
import {
  mutationsSchemaString,
  mutationsResolvers,
} from './mutations/index';

const typeDefs = `
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
      ${inputSelectorSpecSchemaString}
  `;

const resolvers = {
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
  cvVerses: cvVersesResolvers,
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
};

export {
  typeDefs,
  resolvers,
};
