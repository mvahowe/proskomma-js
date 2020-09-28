const { sequencesByType, blockWithId, textFromBlock, indent, graftsStartingWith } = require("../utils");

const remsAttached = (tokenized) => {
    let allPassed = true;
    const mainSeqs = sequencesByType(tokenized, "main");
    const firstBlock = mainSeqs[0].blocks[0];
    const blockGrafts = graftsStartingWith("remark/rem", firstBlock);
    if (blockGrafts.length !== 1) {
        console.log(indent(2, `Expected 1 graft in first block of main sequence, found ${blockGrafts.length}`));
        allPassed = false;
    } else {
        const graftId = blockGrafts[0].split("/")[2];
        const remBlock = blockWithId(tokenized, graftId);
        if (!remBlock) {
            console.log(indent(2, `No block found with id of graft`));
            allPassed = false;
        } else {
            const remText = textFromBlock(remBlock);
            const expectedText = "Need to finish this sentence";
            if (remText !== expectedText) {
                console.log(indent(2, `Expected text of graft[0] to be '${expectedText}', found '${remText}'`));
                allPassed = false;
            }
        }
    }
    return allPassed;
}

module.exports = {remsAttached};