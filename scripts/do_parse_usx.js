const fse = require('fs-extra');

const { ProsKomma } = require('..');

const usx = fse.readFileSync(process.argv[2]);
const pk = new ProsKomma();
pk.importDocument(
    "eng",
    "ust",
    "usx",
    usx,
    {}
);
