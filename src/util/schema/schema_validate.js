import fs from 'fs-extra';
import { Validator } from 'jsonschema';
const schema = fs.readJsonSync('./proskomma_serialized_0_2.json');
const data = fs.readJsonSync(process.argv[2]);
const validationReport = new Validator().validate(data, schema);

if (validationReport.errors.length > 0) {
  console.log(JSON.stringify({ valid: false, errors: validationReport.errors }, null, 2));
} else {
  console.log(JSON.stringify({ valid: true }, null, 2));
}
