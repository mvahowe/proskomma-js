'use strict';
require = require('esm')(module);

const { doTests } = require('../utils');
const { headersPresent, singleParaSequence, singleChapterVerse } = require("./hello.js");
const { cpAsBlock, vpAsBlock, mainTextAfterCpVp } = require("./cp_vp.js");
const { headingsAttached } = require("./headings.js");
const { remsAttached } = require("./rems.js");
const { spansPresent } = require("./spans.js");
const { verseRange } = require("./verse_range.js");
const { startAndEndMilestoneMarkersPresent } = require("./milestone_attributes.js");

const serverHost = process.argv[2];

const tests = [
    [false, "Captures headers", "usfm/hello.usfm", 200, true, t => headersPresent(t)],
    [false, "Captures one-block sequence", "usfm/hello.usfm", 200, true, t => singleParaSequence(t)],
    [false, "Attaches headings", "usfm/headings.usfm", 200, true, t => headingsAttached(t)],
    [false, "Attaches REMs", "usfm/rems.usfm", 200, true, t => remsAttached(t)],
    [false, "Marks spans", "usfm/spans.usfm", 200, true, t => spansPresent(t)],
    [false, "Sets a chapter and verse", "usfm/hello.usfm", 200, true, t => singleChapterVerse(t)],
    [false, "Handles a verse range", "usfm/verse_range.usfm", 200, true, t => verseRange(t)],
    [false, "Handles cp property", "usfm/cp_vp.usfm", 200, true, t => cpAsBlock(t)],
    [false, "Handles vp property", "usfm/cp_vp.usfm", 200, true, t => vpAsBlock(t)],
    [false, "Extracts correct main text after cp/vp", "usfm/cp_vp.usfm", 200, true, t => mainTextAfterCpVp(t)],
    [false, "Adds start and end milestones", "usfm/milestone_attributes.usfm", 200, true, t => startAndEndMilestoneMarkersPresent(t)]
];

const tokenizeTests = async (counters) => {
    await doTests(serverHost, "Tokenizing", tests, counters);
}

export { tokenizeTests };
