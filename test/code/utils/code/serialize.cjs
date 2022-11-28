const path = require('path');
const test = require('tape');
const fs = require('fs-extra');
const Validator = require('jsonschema').Validator;

const { utils } = require('../../../../dist/index');
const serializedSchema = utils.proskommaSerialized;

const testGroup = 'Validate Schema';

test(
  `Validate valid document (${testGroup})`,
  function (t) {
    try {
      t.plan(2);
      const serialized = fs.readJsonSync(path.resolve(__dirname, '../test_data/serialize_example.json'));
      t.ok(serialized);
      const validationReport = new Validator().validate(serialized, serializedSchema);
      // console.log(validationReport);
      t.equal(validationReport.errors.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);
