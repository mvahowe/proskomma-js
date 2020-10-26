const fse = require('fs-extra');
const path = require('path');

const {ProsKomma} = require('../../');

const pkWithDoc = (fp, selectors, options) => {
    if (!options) {options = {}};
    const content = fse.readFileSync(path.resolve(__dirname, fp));
    const contentType = fp.split('.').pop();
    const pk = new ProsKomma();
    const pkDoc = pk.importDocument(
        selectors,
        contentType,
        content,
        options
    );
    return [pk, pkDoc];
}

const customPkWithDoc = (pkClass, fp, selectors, options) => {
    if (!options) {options = {}};
    const content = fse.readFileSync(path.resolve(__dirname, fp));
    const contentType = fp.split('.').pop();
    const pk = new pkClass();
    const pkDoc = pk.importDocument(
        selectors,
        contentType,
        content,
        options
    );
    return [pk, pkDoc];
}

const pkWithDocs = (contentSpecs) => {
    const pk = new ProsKomma();
    for (const [fp, selectors] of contentSpecs) {
        const content = fse.readFileSync(path.resolve(__dirname, fp));
        const contentType = fp.split('.').pop();
        pk.importDocument(
            selectors,
            contentType,
            content,
            {}
        );
    }
    return pk;
}

const customPkWithDocs = (pkClass, contentSpecs) => {
    const pk = new pkClass();
    for (const [fp, selectors] of contentSpecs) {
        const content = fse.readFileSync(path.resolve(__dirname, fp));
        const contentType = fp.split('.').pop();
        pk.importDocument(
            selectors,
            contentType,
            content,
            {}
        );
    }
    return pk;
}

const pkWithDocSetDocs = (fps, selectors, options) => {
    if (!options) {options = {}};
    const fpContent = [];
    fps.forEach(fp => fpContent.push(fse.readFileSync(path.resolve(__dirname, fp))));
    const contentType = fps[0].split('.').pop();
    const pk = new ProsKomma();
    const pkDocs = pk.importDocuments(
        selectors,
        contentType,
        fpContent,
        options
    );
    return [pk, pkDocs];
}

module.exports = { pkWithDoc, customPkWithDoc, pkWithDocs, customPkWithDocs, pkWithDocSetDocs};