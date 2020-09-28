const { textFromBlock, sequencesByType, indent, hasRangeCalled } = require("../utils");

const headersPresent = (tokenized) => {
    let allPassed = true;
    let headerObject = {};
    for (const header of tokenized.headers) {
        headerObject[header.properties.subtype] = header;
    };
    for (const [headerTag, expectedHeaderText] of [
        ["id", "MRK Mark's Gospel, translated by Mark"],
        ["toc1", "The Gospel of Mark"],
        ["toc2", "Mark"],
        ["toc3", "Mk"]
    ]) {
        if (!(headerTag in headerObject)) {
            console.log(indent(2, `'${headerTag}' not found in headers`));
            allPassed = false;
            break;
        }
        const headerText = textFromBlock(headerObject[headerTag]);
        if (headerText !== expectedHeaderText) {
            console.log(indent(2, `Expected header ${headerTag} to be '${expectedHeaderText}' not'${headerText}'`));
            allPassed = false;
            break;
        }
    }
    return allPassed;
}

const singleParaSequence = (tokenized) => {
    let allPassed = true;
    const mainSeqs = sequencesByType(tokenized, "main");
    if (mainSeqs.length !== 1) {
        console.log(indent(2, `Expected 1 main sequence, found ${mainSeqs.length}`));
        allPassed = false;
    } else if (mainSeqs[0].blocks.length !== 1) {
        console.log(indent(2, `Expected 1 block in main sequence, found ${mainSeqs[0].blocks.length}`));
        allPassed = false;
    } else if (mainSeqs[0].blocks[0].properties.subtype !== "p") {
        console.log(indent(2, `Expected first block in main sequence to be p, found ${mainSeqs[0].blocks[0].properties.tag}`));
        allPassed = false;
    } else {
        const mainText = textFromBlock(mainSeqs[0].blocks[0]);
        const expectedMainText = "This is how the Good News of JC began...";
        if (mainText !== expectedMainText) {
            console.log(indent(2, `Expected main sequence text to be '${expectedMainText}', found '${mainText}'`));
            allPassed = false;
        }
    }
    return allPassed;
}

const singleChapterVerse = (tokenized) => {
    let allPassed = true;
    const firstMainToken = sequencesByType(tokenized, "main")[0].blocks[0].tokens[0];
    if (!hasRangeCalled("start", "milestone/chapter/1", firstMainToken )) {
        console.log(indent(2, "No chapter 1 milestone found for first token of main sequence"));
        allPassed = false;
    } else if (!hasRangeCalled("start", "milestone/verses/1", firstMainToken )) {
        console.log(indent(2, "No verses 1 milestone found for first token of main sequence"));
        allPassed = false;
    } else if (!hasRangeCalled("start", "milestone/verse/1", firstMainToken )) {
        console.log(indent(2, "No verse 1 milestone found for first token of main sequence"));
        allPassed = false;
    }
    return allPassed;
}

export {headersPresent, singleParaSequence, singleChapterVerse};
