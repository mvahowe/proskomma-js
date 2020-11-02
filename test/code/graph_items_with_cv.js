const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Items with CV";

const pk = pkWithDoc("../test_data/usx/web_rut.usx", {lang: "fra", abbr: "hello"})[0];
const itemFragment = '{ ... on Token { subType chars } ... on Scope { itemType label } ... on Graft { subType sequenceId } }';

test(
    `Bad cv (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"2") { items(withScriptureCV:"x=y") ${itemFragment} } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.equal(result.errors.filter(e => e.message.includes("Bad cv reference")).length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `withScopes + cv (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"2") { items(withScriptureCV:"2" withScopes:[]) ${itemFragment} } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.equal(result.errors.filter(e => e.message.includes("Cannot specify both withScopes and withScriptureCV")).length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `One Chapter (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"2") { items(withScriptureCV:"2") ${itemFragment} } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            const firstBlockItems = blocks[0].items;
            const lastBlockItems = blocks[blocks.length - 1].items;
            t.equal(firstBlockItems.filter(i => i.subType === "wordLike")[0].chars, "Naomi");
            t.equal(lastBlockItems.filter(i => i.subType === "wordLike").reverse()[0].chars, "law");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Chapter Range (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1-3") { items(withScriptureCV:"1-3") ${itemFragment} } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            const firstBlockItems = blocks[0].items;
            const lastBlockItems = blocks[blocks.length - 1].items;
            t.equal(firstBlockItems.filter(i => i.subType === "wordLike")[0].chars, "In");
            t.equal(lastBlockItems.filter(i => i.subType === "wordLike").reverse()[0].chars, "today");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Reverse Chapter Range (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1-3") { items(withScriptureCV:"3-1") ${itemFragment} } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.equal(result.errors.filter(e => e.message.includes("Chapter range must be from min to max")).length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `One verse (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:15") { items(withScriptureCV:"1:15") ${itemFragment} } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            const firstBlockItems = blocks[0].items;
            const lastBlockItems = blocks[blocks.length - 1].items;
            t.equal(firstBlockItems.filter(i => i.subType === "wordLike")[0].chars, "She");
            t.equal(lastBlockItems.filter(i => i.subType === "wordLike").reverse()[0].chars, "law");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Verse range (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:10-13") { items(withScriptureCV:"1:10-13") ${itemFragment} } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            const firstBlockItems = blocks[0].items;
            const lastBlockItems = blocks[blocks.length - 1].items;
            t.equal(firstBlockItems.filter(i => i.subType === "wordLike")[0].chars, "They");
            t.equal(lastBlockItems.filter(i => i.subType === "wordLike").reverse()[0].chars, "me");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Chapter/verse range (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:22-3:3") { items(withScriptureCV:"1:22-3:3") ${itemFragment} } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            const firstBlockItems = blocks[0].items;
            const lastBlockItems = blocks[blocks.length - 1].items;
            t.equal(firstBlockItems.filter(i => i.subType === "wordLike")[0].chars, "So");
            t.equal(lastBlockItems.filter(i => i.subType === "wordLike").reverse()[0].chars, "drinking");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Chapter/verse range tokens (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:22-3:3") { tokens(withScriptureCV:"1:22-3:3") { subType chars } } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            const firstBlockItems = blocks[0].tokens;
            const lastBlockItems = blocks[blocks.length - 1].tokens;
            t.equal(firstBlockItems[0].chars, "So");
            t.equal(lastBlockItems.filter(i => i.subType === "wordLike").reverse()[0].chars, "drinking");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Chapter/verse range text (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                `{ docSets { document: documentWithBook(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:22-3:3") { text(withScriptureCV:"1:22-3:3") } } } }
                }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            const firstBlockText = blocks[0].text;
            const lastBlockText = blocks[blocks.length - 1].text;
            t.ok(firstBlockText.startsWith("So"));
            t.ok(lastBlockText.endsWith("drinking."));
        } catch (err) {
            console.log(err)
        }
    }
);
