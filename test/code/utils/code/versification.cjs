const test = require('tape');
const fse = require('fs-extra');
const path = require('path');
const deepEqual = require('deep-equal');

const {utils} = require("../../../../dist/index");
const {
    vrs2json,
    reverseVersification,
    preSuccinctVerseMapping,
    succinctifyVerseMappings,
    unsuccinctifyVerseMapping,
    bookCodeIndex,
    mapVerse,
} = utils.versification;

const testGroup = 'Versification';

test(
    `vrs2json (${testGroup})`,
    function (t) {
        try {
            t.plan(1);
            const vrsString = fse.readFileSync(path.resolve(__dirname, '../test_data/truncated_versification.vrs')).toString();
            const vrsJson = vrs2json(vrsString);
            // console.log(JSON.stringify(vrsJson));
            t.ok(Object.keys(vrsJson.mappedVerses).length > 0);
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `reverseVersification (${testGroup})`,
    function (t) {
        try {
            const vrsString = fse.readFileSync(path.resolve(__dirname, '../test_data/truncated_versification.vrs')).toString();
            const vrsJson = vrs2json(vrsString);
            const vrsJsonLength = Object.keys(vrsJson.mappedVerses).length;
            t.plan(vrsJsonLength);
            // console.log(JSON.stringify(vrsJson, null, 2));
            const reversed = reverseVersification(vrsJson);
            // console.log(JSON.stringify(reversed, null, 2));
            for (const [key, value] of (Object.entries(vrsJson.mappedVerses))) {
                t.ok(value[0] in reversed.reverseMappedVerses);
            }
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `preSuccinctVerseMapping (${testGroup})`,
    function (t) {
        try {
            t.plan(18);
            const vrsString = fse.readFileSync(path.resolve(__dirname, '../test_data/truncated_versification.vrs')).toString();
            const vrsJson = vrs2json(vrsString);
            const preSuccinct = preSuccinctVerseMapping(vrsJson.mappedVerses);
            let preSuccinctBooks = ['GEN', 'LEV', 'PSA', 'ACT', 'S3Y'];
            t.equal(Object.keys(preSuccinct).length, preSuccinctBooks.length);
            for (const book of preSuccinctBooks) {
                t.ok(book in preSuccinct);
            }
            t.ok('31' in preSuccinct['GEN']);
            t.ok('32' in preSuccinct['GEN']);
            t.ok(preSuccinct['S3Y']['1'][0][2][0].includes('DAG'))
            const reversed = reverseVersification(vrsJson);
            const preSuccinctReversed = preSuccinctVerseMapping(reversed.reverseMappedVerses);
            preSuccinctBooks = ['GEN', 'LEV', 'PSA', 'ACT', 'DAG'];
            t.equal(Object.keys(preSuccinctReversed).length, preSuccinctBooks.length);
            for (const book of preSuccinctBooks) {
                t.ok(book in preSuccinctReversed);
            }
            t.ok('5' in preSuccinctReversed['LEV']);
            t.ok('6' in preSuccinctReversed['LEV']);
            t.ok(preSuccinctReversed['DAG']['3'][0][2][0].includes('S3Y'))
            // console.log(JSON.stringify(preSuccinctReversed, null, 2));
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `succinctifyVerseMappings (${testGroup})`,
    function (t) {
        try {
            t.plan(16);
            const vrsString = fse.readFileSync(path.resolve(__dirname, '../test_data/truncated_versification.vrs')).toString();
            const vrsJson = vrs2json(vrsString);
            const succinct = succinctifyVerseMappings(vrsJson.mappedVerses);
            let succinctBooks = ['GEN', 'LEV', 'PSA', 'ACT', 'S3Y'];
            t.equal(Object.keys(succinct).length, succinctBooks.length);
            for (const book of succinctBooks) {
                t.ok(book in succinct);
            }
            t.ok('31' in succinct['GEN']);
            t.ok('32' in succinct['GEN']);
            const succinctReversed = succinctifyVerseMappings(reverseVersification(vrsJson).reverseMappedVerses);
            succinctBooks = ['GEN', 'LEV', 'PSA', 'ACT', 'DAG'];
            t.equal(Object.keys(succinctReversed).length, succinctBooks.length);
            for (const book of succinctBooks) {
                t.ok(book in succinctReversed);
            }
            t.ok('5' in succinctReversed['LEV']);
            t.ok('6' in succinctReversed['LEV']);
            // console.log(JSON.stringify(succinct, null, 2));
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `unsuccinctify forward (${testGroup})`,
    function (t) {
        try {
            t.plan(15);
            const vrsString = fse.readFileSync(path.resolve(__dirname, '../test_data/truncated_versification.vrs')).toString();
            const vrsJson = vrs2json(vrsString);
            const svm = succinctifyVerseMappings(vrsJson.mappedVerses);
            const unsuccinctS3Y = unsuccinctifyVerseMapping(svm['S3Y']['1'], 'S3Y', bookCodeIndex());
            t.equal(unsuccinctS3Y[0].fromVerseStart, 1);
            t.equal(unsuccinctS3Y[0].fromVerseEnd, 29);
            t.equal(unsuccinctS3Y[0].bookCode, 'DAG');
            t.equal(unsuccinctS3Y[0].mapping[0].ch, 3);
            t.equal(unsuccinctS3Y[0].mapping[0].verseStart, 24);
            const unsuccinctACT = unsuccinctifyVerseMapping(svm['ACT']['19'], 'ACT', bookCodeIndex());
            // console.log(JSON.stringify(unsuccinctACT, null, 2));
            t.equal(unsuccinctACT[0].fromVerseStart, 40);
            t.equal(unsuccinctACT[0].fromVerseEnd, 40);
            t.equal(unsuccinctACT[0].bookCode, 'ACT');
            t.equal(unsuccinctACT[0].mapping[0].ch, 19);
            t.equal(unsuccinctACT[0].mapping[0].verseStart, 40);
            t.equal(unsuccinctACT[1].fromVerseStart, 41);
            t.equal(unsuccinctACT[1].fromVerseEnd, 41);
            t.equal(unsuccinctACT[1].bookCode, 'ACT');
            t.equal(unsuccinctACT[1].mapping[0].ch, 19);
            t.equal(unsuccinctACT[1].mapping[0].verseStart, 40);
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `unsuccinctify reverse (${testGroup})`,
    function (t) {
        try {
            t.plan(12);
            const vrsString = fse.readFileSync(path.resolve(__dirname, '../test_data/truncated_versification.vrs')).toString();
            const vrsJson = vrs2json(vrsString);
            const reversedJson = reverseVersification(vrsJson);
            const svm = succinctifyVerseMappings(reversedJson.reverseMappedVerses);
            const unsuccinctDAG = unsuccinctifyVerseMapping(svm['DAG']['3'], 'DAG', bookCodeIndex());
            t.equal(unsuccinctDAG[0].fromVerseStart, 24);
            t.equal(unsuccinctDAG[0].fromVerseEnd, 52);
            t.equal(unsuccinctDAG[0].bookCode, 'S3Y');
            t.equal(unsuccinctDAG[0].mapping[0].ch, 1);
            t.equal(unsuccinctDAG[0].mapping[0].verseStart, 1);
            const unsuccinctACT = unsuccinctifyVerseMapping(svm['ACT']['19'], 'ACT', bookCodeIndex());
            t.equal(unsuccinctACT[0].fromVerseStart, 40);
            t.equal(unsuccinctACT[0].fromVerseEnd, 40);
            t.equal(unsuccinctACT[0].bookCode, 'ACT');
            t.equal(unsuccinctACT[0].mapping[0].ch, 19);
            t.equal(unsuccinctACT[0].mapping[0].verseStart, 40);
            t.equal(unsuccinctACT[0].mapping[1].ch, 19);
            t.equal(unsuccinctACT[0].mapping[1].verseStart, 41);
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `mapVerse forward (${testGroup})`,
    function (t) {
        try {
            const vrsString = fse.readFileSync(path.resolve(__dirname, '../test_data/truncated_versification.vrs')).toString();
            const mappings = [
                [["GEN", 31, 1], ["GEN", 31, 1]],
                [["GEN", 31, 55], ["GEN", 32, 1]],
                [["GEN", 32, 17], ["GEN", 32, 18]],
                [["PSA", 51, 0], ["PSA", 51, 1]],
                [["PSA", 51, 1], ["PSA", 51, 3]],
                [["ACT", 19, 40], ["ACT",19, 40]],
                [["ACT", 19, 41], ["ACT",19, 40]],
                [["S3Y", 1, 2], ["DAG", 3, 25]],
            ];
            t.plan(3 * mappings.length);
            const vrsJson = vrs2json(vrsString);
            const svm = succinctifyVerseMappings(vrsJson.mappedVerses);
            for (const [[fromBook, fromCh, fromV], [toBook, toCh, toV]] of mappings) {
                const succinct = svm[fromBook][fromCh.toString()];
                const mapping = mapVerse(succinct, fromBook, fromCh, fromV);
                t.equal(mapping[0], toBook);
                t.equal(mapping[1][0][0], toCh);
                t.equal(mapping[1][0][1], toV);
            }
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `mapVerse reverse (${testGroup})`,
    function (t) {
        try {
            const vrsString = fse.readFileSync(path.resolve(__dirname, '../test_data/truncated_versification.vrs')).toString();
            const mappings = [
                [["GEN", 32, 99], ["GEN", [[32, 99]]]],
                [["GEN", 32, 1], ["GEN", [[31, 55]]]],
                [["GEN", 32, 18], ["GEN", [[32, 17]]]],
                [["PSA", 11, 1], ["PSA", [[10, 2]]]],
                [["PSA", 51, 1], ["PSA", [[51, 0]]]],
                [["PSA", 51, 2], ["PSA", [[51, 0]]]],
                [["PSA", 51, 3], ["PSA", [[51, 1]]]],
                [["ACT", 19, 40], ["ACT", [[19, 40], [19, 41]]]],
                [["DAG", 3, 25], ["S3Y", [[1, 2]]]],
            ];
            t.plan(2 * mappings.length);
            const forwardJson = vrs2json(vrsString);
            // console.log(JSON.stringify(forwardJson, null, 2))
            const reverseJson = reverseVersification(forwardJson);
            // console.log(JSON.stringify(reverseJson, null, 2))
            const svm = succinctifyVerseMappings(reverseJson.reverseMappedVerses);
            for (const [[fromBook, fromCh, fromV], [toBook, toSpecs]] of mappings) {
                const succinct = svm[fromBook][fromCh.toString()];
                const mapping = mapVerse(succinct, fromBook, fromCh, fromV);
                t.equal(mapping[0], toBook);
                t.ok(deepEqual(mapping[1], toSpecs));
            }
        } catch (err) {
            console.log(err);
        }
    },
);

