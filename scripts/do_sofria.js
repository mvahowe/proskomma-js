const fse = require('fs-extra');

const { Proskomma } = require('../dist/index.js');

if (process.argv.length < 3 || process.argv.length > 4) {
  console.log('USAGE: node do_sofria.js <USFM/USX Path> [chN]');
  process.exit(1);
}

const contentPath = process.argv[2];
let content;

try {
  content = fse.readFileSync(contentPath);
} catch (err) {
  console.log(`ERROR: Could not read from USFM/USX file '${contentPath}'`);
  process.exit(1);
}

const contentType = contentPath.split('.').pop();
let query = `{ documents { sofria${process.argv[3] ? "(chapter: " + process.argv[3] + ")": ""} } }`;

const pk = new Proskomma();
//try {
let selectors = {
  lang: 'lan',
  abbr: 'myabbr',
};

pk.importDocument(
  selectors,
  contentType,
  content,
);
/*
} catch (err) {
console.log(`ERROR: Could not import document: '${err}'\n`);
console.trace();
process.exit(1);
}

 */
pk.gqlQuery(query)
  .then(output => console.log(JSON.stringify(JSON.parse(output.data.documents[0].sofria), null, 2)))
  .catch(err => console.log(`ERROR: Could not run query: '${err}'`));
