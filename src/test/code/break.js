const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Lexing Breaks";

const pk = pkWithDoc("../test_data/usfm/no_break_space.usfm", {lang: "fra", abbr: "hello"})[0];
const pk2 = pkWithDoc("../test_data/usfm/soft_line_break.usfm", {lang: "fra", abbr: "hello"})[0];
const pk3 = pkWithDoc("../test_data/usx/opt_break.usx", {lang: "fra", abbr: "hello"})[0];

test(
    `NBSP (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { itemType label } ... on Graft { subType sequenceId } }';
            const query = `{ documents { mainSequence { blocks { items ${itemFragment} } } } }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const secondItem = result.data.documents[0].mainSequence.blocks[0].items[1];
            t.equal(secondItem.subType, "lineSpace");
            t.equal(secondItem.chars, '\xa0');
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Soft line break with USFM (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { itemType label } ... on Graft { subType sequenceId } }';
            const query = `{ documents { mainSequence { blocks { items ${itemFragment} } } } }`;
            const result = await pk2.gqlQuery(query);
            t.equal(result.errors, undefined);
            const secondItem = result.data.documents[0].mainSequence.blocks[0].items[1];
            t.equal(secondItem.subType, "softLineBreak");
            t.equal(secondItem.chars, '//');
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Soft line break with USX (${testGroup})`,
    async function (t) {
        try {
            t.plan(5);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { itemType label } ... on Graft { subType sequenceId } }';
            const query = `{ documents { sequences { type blocks { items ${itemFragment} } } } }`;
            const result = await pk3.gqlQuery(query);
            t.equal(result.errors, undefined);
            const sequences = result.data.documents[0].sequences;
            const headingSequence = sequences.filter(s => s.type === "heading")[0];
            t.equal(headingSequence.blocks[0].items[3].subType, "softLineBreak");
            t.equal(headingSequence.blocks[0].items[3].chars, "//");
            const titleSequence = sequences.filter(s => s.type === "title")[0];
            t.equal(titleSequence.blocks[0].items[3].subType, "softLineBreak");
            t.equal(titleSequence.blocks[0].items[3].chars, "//");
        } catch (err) {
            console.log(err)
        }
    }
);