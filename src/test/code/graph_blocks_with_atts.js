const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Blocks with Atts";

const pk = pkWithDoc("../test_data/usfm/1pe_webbe.usfm", {lang: "eng", abbr: "hello"})[0];
const pk2 = pkWithDoc("../test_data/usfm/en_ust_oba.usfm", {lang: "eng", abbr: "hello"})[0];

test(
    `attSpecs +  !attValues (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document(bookCode:"1PE") {' +
                '    mainSequence {' +
                '      blocks(' +
                '        attSpecs: [[{attType:"spanWithAtts", tagName:"w", attKey:"strongs", valueN:0}]]' +
                '      ) {' +
                '        cBL' +
                '        }' +
                '      }' +
                '    }' +
                '  }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.ok(result.errors[0].message.includes("Cannot specify attSpecs without attValues"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `!attSpecs +  attValues (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document(bookCode:"1PE") {' +
                '    mainSequence {' +
                '      blocks(' +
                '        attValues:[["H5662"]]' +
                '      ) {' +
                '        cBL' +
                '        }' +
                '      }' +
                '    }' +
                '  }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.ok(result.errors[0].message.includes("Cannot specify attValues without attSpecs"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Filter by att (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document(bookCode:"1PE") {' +
                '    mainSequence {' +
                '      blocks(' +
                '        attSpecs: [[{attType:"spanWithAtts", tagName:"w", attKey:"strong", valueN:0}]]' +
                '        attValues:[["G2587"]]' +
                '      ) {' +
                '        cBL' +
                '        }' +
                '      }' +
                '    }' +
                '  }' +
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
    `Any matching att (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document(bookCode:"1PE") {' +
                '    mainSequence {' +
                '      blocks(' +
                '        attSpecs: [' +
                '          [{attType:"spanWithAtts", tagName:"w", attKey:"strong", valueN:0}],' +
                '          [{attType:"spanWithAtts", tagName:"w", attKey:"strong", valueN:0}]' +
                '        ]' +
                '        attValues:[["G2587"], ["G2962"]]' +
                '      ) {' +
                '        cBL' +
                '        }' +
                '      }' +
                '    }' +
                '  }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 2);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `All matching atts (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document(bookCode:"1PE") {' +
                '    mainSequence {' +
                '      blocks(' +
                '        attSpecs: [' +
                '          [{attType:"spanWithAtts", tagName:"w", attKey:"strong", valueN:0}],' +
                '          [{attType:"spanWithAtts", tagName:"w", attKey:"strong", valueN:0}]' +
                '        ]' +
                '        attValues:[["G2532", "G9999"], ["G1519", "G0000"]]' +
                '        allAtts:true' +
                '      ) {' +
                '        cBL' +
                '        }' +
                '      }' +
                '    }' +
                '  }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets[0].document.mainSequence.blocks.length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);
