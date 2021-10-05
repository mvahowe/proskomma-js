// eg node merge_trees.js ../../../Desktop/mike_texts/ ^ps.*.trees.json$ ../../../Desktop/psa_merged.json
const path = require('path');
const fse = require('fs-extra');
const xre = require('xregexp');

if (process.argv.length !== 5) {
  console.log('USAGE: node merge_trees.js <srcDirPath> <srcFileRegex> <destPath>');
  process.exit(1);
}

let [srcDir, srcFileRegex, destPath] = process.argv.slice(2);
srcFileRegex = xre(srcFileRegex);
let children = [];

for (const file of
  fse.readdirSync(path.resolve(__dirname, srcDir))
    .filter(fn => xre.test(fn, srcFileRegex))
) {
  fse.readJsonSync(path.resolve(__dirname, srcDir, file)).children.forEach(c => children.push(c));
}

fse.writeJsonSync(
  path.resolve(__dirname, destPath),
  {
    content: { elementType: 'Sentences' },
    children,
  },
);
