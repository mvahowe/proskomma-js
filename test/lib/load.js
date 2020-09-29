const fse = require('fs-extra');
const path = require('path');

const {ProsKomma} = require('../../');

const pkWithDoc = (fp, lang, abbr) => {
    const content = fse.readFileSync(path.resolve(__dirname, fp));
    const contentType = fp.split('.').pop();
    const pk = new ProsKomma();
    const pkDoc = pk.importDocument(
        lang,
        abbr,
        contentType,
        content,
        {}
    );
    return [pk, pkDoc];
}

module.exports = { pkWithDoc };