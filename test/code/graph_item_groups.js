const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graph Item Groups";

const pk = pkWithDoc("../test_data/usfm/verse_breaks_in_blocks.usfm", {lang: "eng", abbr: "ust"})[0];

test(
    `Text (${testGroup})`,
    async function (t) {
        try {
            t.plan(8);
            const query = '{ documents { mainSequence { itemGroups(byScopes:["chapter/", "verse/"]) {' +
                'scopeLabels text ' +
                '} } } }';
            let result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const itemGroups = result.data.documents[0].mainSequence.itemGroups;
            t.equal(itemGroups.length, 3);
            t.equal(itemGroups[1].scopeLabels.length, 3);
            t.ok(itemGroups[1].scopeLabels.includes("chapter/1"));
            t.ok(itemGroups[1].scopeLabels.includes("verse/2"));
            t.ok(itemGroups[1].scopeLabels.includes("blockTag/q"));
            t.ok(itemGroups[1].text.startsWith("Instead"));
            t.ok(itemGroups[1].text.endsWith("Yahweh teaches."));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Items & tokens (${testGroup})`,
    async function (t) {
        try {
            t.plan(7);
            const itemFragment = '{ ... on Token { itemType subType chars } ... on Scope { itemType label } ... on Graft { itemType subType sequenceId } }';
            const query = '{ documents { mainSequence { itemGroups(byScopes:["chapter/", "verse/"]) {' +
                'scopeLabels ' +
                `items ${itemFragment} ` +
                'tokens { chars }' +
                '} } } }';
            let result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const itemGroups = result.data.documents[0].mainSequence.itemGroups;
            t.equal(itemGroups.length, 3);
            t.equal(itemGroups[1].scopeLabels.length, 3);
            t.equal(itemGroups[1].items.filter(i => i.itemType === "token")[0].chars, "Instead");
            t.equal(itemGroups[1].items.filter(i => i.itemType === "token").reverse()[0].chars, ".");
            t.equal(itemGroups[1].tokens[0].chars, "Instead");
            t.equal([...itemGroups[1].tokens].reverse()[0].chars, ".");
            console.log(JSON.stringify(result.data, null, 2));
        } catch (err) {
            console.log(err)
        }
    }
);