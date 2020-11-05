const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Blocks with Strongs";

const pk = pkWithDoc("../test_data/usfm/1pe_webbe.usfm", {lang: "eng", abbr: "hello"})[0];
const pk2 = pkWithDoc("../test_data/usfm/en_ust_oba.usfm", {lang: "eng", abbr: "hello"})[0];

test(
    `Bad Strongs (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"1PE") {' +
                '     mainSequence { blocks(withAllStrongs:["x=y"]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.ok(result.errors[0].message.includes("Bad Strongs format"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `withAllStrongs + withAnyStrongs (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"1PE") {' +
                '      mainSequence { blocks(withAllStrongs:["H1234"] withAnyStrongs:["H1234"]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.ok(result.errors[0].message.includes("Cannot specify both withAllStrongs and withAnyStrongs"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Strongs empty array (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"1PE") {' +
                '      mainSequence { blocks(withAllStrongs:[]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 3);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Non-matching Strongs (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"1PE") {' +
                '      mainSequence { blocks(withAllStrongs:["H9999"]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 0);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `All with one Strongs (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"1PE") {' +
                '      mainSequence { blocks(withAllStrongs:["G2587"]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Any with one Strongs (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"1PE") {' +
                '      mainSequence { blocks(withAnyStrongs:["G2587"]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `All with two Strongs (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"1PE") {' +
                '      mainSequence { blocks(withAllStrongs:["G2532", "G3588"]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Any with two Strongs (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"1PE") {' +
                '      mainSequence { blocks(withAnyStrongs:["G2532", "G3588"]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 3);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `with uW zaln (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"OBA") {' +
                '      mainSequence { blocks(withAnyStrongs:["H5662"]) { cBL } } } }' +
                '}';
            const result = await pk2.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);

