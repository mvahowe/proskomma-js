const fse = require('fs-extra');

const { Proskomma } = require('../dist/index.js');

if (process.argv.length !== 6) {
  console.log('USAGE: node usfm2succinct <Lang>  <Abbr> <USFM/USX Path> <Destination Path>');
  process.exit(1);
}

const lang = process.argv[2];
const abbr = process.argv[3];
const contentPath = process.argv[4];
const destinationPath = process.argv[5];
let content;

try {
  content = fse.readFileSync(contentPath);
} catch (err) {
  console.log(`ERROR: Could not read from USFM/USX file '${contentPath}'`);
  process.exit(1);
}

const contentType = contentPath.split('.').pop();

const pk = new Proskomma();
//try {
let selectors = {
  lang,
  abbr,
};


pk.importDocument(
  selectors,
  contentType,
  content,
);

const docSetId = Object.values(pk.docSets)[0].id;
const succinct = pk.serializeSuccinct(docSetId);

try{
  fse.writeFileSync(destinationPath, JSON.stringify(succinct));
} catch (err) {
  console.log('ERROR : File not created');
}

/*
const pk2 = new Proskomma();
pk2.loadSuccinctDocSet(succinct);

pk2.gqlQuery("{nDocSets nDocuments documents {headers {key value}}}")
    .then(output => console.log(JSON.stringify(output, null, 2)))
    .catch(err => console.log(`ERROR: Could not run query: '${err}'`));
*/
