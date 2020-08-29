const fse = require('fs-extra');

const { ProsKomma } = require('..');

const usfm = fse.readFileSync(process.argv[2]);
const pk = new ProsKomma();
pk.importDocument("eng", "ust", usfm);
