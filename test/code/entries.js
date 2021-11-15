const path = require('path');
const fse = require('fs-extra');
const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const { blocksSpec2Query } = require('../../src/util/blocksSpec');
const { Validator } = require('jsonschema');
const { serializedSchema } = require('proskomma-utils');

const [pk, pkDoc] = pkWithDoc('../test_data/usfm/66-JUD-ust.usfm', {
  lang: 'eng',
  abbr: 'ust',
});

const cleanKV = entry => {
  const fields = {};
  entry.itemGroups.forEach(ig => fields[ig.scopeLabels[0].split('/')[1]] = ig.text);
  const secondaryKeys = {};
  entry.secondaryKeys.forEach(k => secondaryKeys[k.key] = k.value);
  return {
    key: entry.key,
    secondaryKeys,
    fields,
  };
};

const testGroup = 'Entries';

test(
  `kv mutation (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const kvQuery = blocksSpec2Query(
        fse.readJSONSync(path.resolve(__dirname, '../test_data/inputBlockSpec/kv.json')),
      );

      let query = `mutation { newSequence(` +
        ` documentId: "${pkDoc.id}"` +
        ` type: "kv"` +
        ` blocksSpec: ${kvQuery}` +
        ` graftToMain: true) }`;

      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSeqId = result.data.newSequence;
      query = `mutation { addSequenceTags(docSetId: "eng_ust", documentId: "${pkDoc.id}", sequenceId: "${newSeqId}", tags: ["kv"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Without args (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            kvSequences(withTags:"kv") {
              nEntries
              entries {
                key
                secondaryKeys { key value }
                itemGroups {
                  scopeLabels(startsWith:"kvField")
                  text
                }
              }
            }
          }
        }
      }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].document;
      const kv = document.kvSequences[0].entries.map(kv => cleanKV(kv));
      t.equal(document.kvSequences[0].nEntries, 3);
      t.equal(kv.length, 3);
      t.equal(kv[0].key, 'a');
      t.equal(Object.keys(kv[0].secondaryKeys).length, 2);
      t.equal(kv[0].secondaryKeys['service'], 'dessert');
      t.equal(Object.keys(kv[0].fields).length, 2);
      t.equal(kv[0].fields['name'], 'apple');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `keyEquals (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            kvSequences(withTags:"kv") {
              entries(keyEquals: ["a", "c"]) {
                key
                secondaryKeys { key value }
                itemGroups {
                  scopeLabels(startsWith:"kvField")
                  text
                }
              }
            }
          }
        }
      }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].document;
      const kv = document.kvSequences[0].entries.map(kv => cleanKV(kv));
      t.equal(kv.length, 2);
      t.equal(kv[0].key, 'a');
      t.equal(kv[1].key, 'c');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `keyMatches (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            kvSequences(withTags:"kv") {
              entries(keyMatches: "[ab]") {
                key
                secondaryKeys { key value }
                itemGroups {
                  scopeLabels(startsWith:"kvField")
                  text
                }
              }
            }
          }
        }
      }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].document;
      const kv = document.kvSequences[0].entries.map(kv => cleanKV(kv));
      t.equal(kv.length, 2);
      t.equal(kv[0].key, 'a');
      t.equal(kv[1].key, 'b');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `secondaryEquals (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            kvSequences(withTags:"kv") {
              entries(secondaryEquals: [{key: "color", values: "green"}, {key: "service", values: "starter"}]) {
                key
                secondaryKeys { key value }
                itemGroups {
                  scopeLabels(startsWith:"kvField")
                  text
                }
              }
            }
          }
        }
      }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].document;
      const kv = document.kvSequences[0].entries.map(kv => cleanKV(kv));
      t.equal(kv.length, 1);
      t.equal(kv[0].key, 'c');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `secondaryMatches (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            kvSequences(withTags:"kv") {
              entries(secondaryMatches: [{key: "color", matches: "ree"}, {key: "service", matches: "tar"}]) {
                key
                secondaryKeys { key value }
                itemGroups {
                  scopeLabels(startsWith:"kvField")
                  text
                }
              }
            }
          }
        }
      }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].document;
      const kv = document.kvSequences[0].entries.map(kv => cleanKV(kv));
      t.equal(kv.length, 1);
      t.equal(kv[0].key, 'c');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `contentMatches (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            kvSequences(withTags:"kv") {
              entries(contentMatches: [{key: "name", matches: "pl|na"}, {key: "definition", matches: "obj"}]) {
                key
                secondaryKeys { key value }
                itemGroups {
                  scopeLabels(startsWith:"kvField")
                  text
                }
              }
            }
          }
        }
      }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].document;
      const kv = document.kvSequences[0].entries.map(kv => cleanKV(kv));
      t.equal(kv.length, 1);
      t.equal(kv[0].key, 'b');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `contentEquals (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            kvSequences(withTags:"kv") {
              entries(contentEquals: [{key: "name", values: "apple"}, {key: "definition", values: "A tasty snack"}]) {
                key
                secondaryKeys { key value }
                itemGroups {
                  scopeLabels(startsWith:"kvField")
                  text
                }
              }
            }
          }
        }
      }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].document;
      const kv = document.kvSequences[0].entries.map(kv => cleanKV(kv));
      t.equal(kv.length, 1);
      t.equal(kv[0].key, 'a');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Dodson lexicon mutation (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const dodsonQuery = blocksSpec2Query(
        fse.readJSONSync(path.resolve(__dirname, '../test_data/inputBlockSpec/dodson.json')),
      );

      let query = `mutation { newSequence(` +
        ` documentId: "${pkDoc.id}"` +
        ` type: "kv"` +
        ` blocksSpec: ${dodsonQuery}` +
        ` graftToMain: true) }`;

      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSeqId = result.data.newSequence;
      query = `mutation { addSequenceTags(docSetId: "eng_ust", documentId: "${pkDoc.id}", sequenceId: "${newSeqId}", tags: ["dodson"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Dodson queries (${testGroup})`,
  async function (t) {
    try {
      t.plan(13);

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            kvSequences(withTags:"dodson") {
              nEntries
              allEntries: entries {
                key
                secondaryKeys { key value }
                itemGroups {
                  scopeLabels(startsWith:"kvField")
                  text
                }
              }
              byLemma: entries(keyEquals: ["ἀβαρής"]) { key }
              byStrong: entries(secondaryEquals: [{key: "strong", values: "0007"}]) { key }
              byContent: entries(contentMatches: [{key: "fullDef", matches: "son.+Amram"}]) { key itemGroups { text } }
            }
          }
        }
      }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].document;
      const allEntries = document.kvSequences[0].allEntries.map(kv => cleanKV(kv));
      t.equal(document.kvSequences[0].nEntries, 9);
      t.equal(allEntries.length, 9);
      t.equal(allEntries[0].key, 'ἄλφα');
      t.equal(Object.keys(allEntries[0].secondaryKeys).length, 1);
      t.equal(allEntries[0].secondaryKeys['strong'], '0001');
      t.equal(Object.keys(allEntries[0].fields).length, 2);
      t.ok(allEntries[0].fields['briefDef'].startsWith('the first letter'));
      const lemmaEntries = document.kvSequences[0].byLemma;
      t.equal(lemmaEntries.length, 1);
      t.equal(lemmaEntries[0].key, 'ἀβαρής');
      const strongEntries = document.kvSequences[0].byStrong;
      t.equal(strongEntries.length, 1);
      t.equal(strongEntries[0].key, 'Ἀβιά');
      const sonEntries = document.kvSequences[0].byContent;
      t.equal(sonEntries.length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Serialize (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ docSets { id } }';
      const result = await pk.gqlQuery(query);
      const docSetId = result.data.docSets[0].id;
      const serialized = pk.serializeSuccinct(docSetId);
      t.ok(serialized);
      const validationReport = new Validator().validate(serialized, serializedSchema);
      t.equal(validationReport.errors.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);
