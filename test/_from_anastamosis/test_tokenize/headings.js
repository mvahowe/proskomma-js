const {sequencesByType, blockWithId, textFromBlock, indent, graftsStartingWith } = require("../utils");

const headingsAttached = (tokenized) => {
    let allPassed = true;
    const mainSeqs = sequencesByType(tokenized, "main");
    const firstBlock = mainSeqs[0].blocks[0];
    const blockGrafts = graftsStartingWith("heading/", firstBlock);
    if (blockGrafts.length !== 2) {
        console.log(indent(2, `Expected 2 heading grafts in first block of main sequence, found ${blockGrafts.length}`));
        allPassed = false;
    } else {
        for (const [graftNo, expectedText] of [[0, "ACTS"], [1, "Prologue"]]) {
            const graftId = blockGrafts[graftNo].split("/")[2];
            const headingBlock = blockWithId(tokenized, graftId);
            if (!headingBlock) {
                console.log(indent(2, `No block found with id of graft[${graftNo}]`));
                allPassed = false;
            } else {
                const headingText = textFromBlock(headingBlock);
                if (headingText !== expectedText) {
                    console.log(indent(2, `Expected text of graft[${graftNo}] to be '${expectedText}', found '${headingText}'`));
                    allPassed = false;
                }
            }
        }
    }
    return allPassed;
}

    module.exports = {headingsAttached};