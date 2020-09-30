const {sequencesByType, blockWithId, textFromBlock, indent, graftsStartingWith } = require("../utils");

const cpAsBlock = (tokenized) => {
    let allPassed = true;
    const mainSeqs = sequencesByType(tokenized, "main");
    const firstToken = mainSeqs[0].blocks[0].tokens[0];
    const cpGrafts = graftsStartingWith("graft/cp/", firstToken);
    if ((cpGrafts.length !== 1)) {
        console.log(indent(2, "Expected exactly 1 cp property in first token of first block of main sequence"));
        allPassed = false;
    } else {
        const cpId = cpGrafts[0].split("/")[2];
        const cpBlock = blockWithId(tokenized, cpId);
        if (!cpBlock) {
            console.log(indent(2, `Could not find cp block ${cpId}`));
            allPassed = false;
        } else {
            const cpText = textFromBlock(cpBlock);
            if (cpText !== "B") {
                console.log(indent(2, `Expected 'B' in cp block, found '${cpText}'`));
                allPassed = false;
            }
        }
    }
    return allPassed;
}

const vpAsBlock = (tokenized) => {
    let allPassed = true;
    const mainSeqs = sequencesByType(tokenized, "main");
    const firstToken = mainSeqs[0].blocks[0].tokens[0];
    const vpGrafts = graftsStartingWith("graft/vp/", firstToken);
    if ((vpGrafts.length !== 1)) {
        console.log(indent(2, "Expected exactly 1 vp property in first token of first block of main sequence"));
        allPassed = false;
    } else {
        const vpId = vpGrafts[0].split("/")[2];
        const cpBlock = blockWithId(tokenized, vpId);
        if (!cpBlock) {
            console.log(indent(2, `Could not find vp block ${vpId}`));
            allPassed = false;
        } else {
            const cpText = textFromBlock(cpBlock);
            if (cpText !== "1b") {
                console.log(indent(2, `Expected 'B' in cp block, found '${cpText}'`));
                allPassed = false;
            }
        }
    }
    return allPassed;
}

const mainTextAfterCpVp = (tokenized) => {
    let allPassed = true;
    const mainSeqs = sequencesByType(tokenized, "main");
    const firstBlock = mainSeqs[0].blocks[0];
    const blockText = textFromBlock(firstBlock);
    const expectedText = "Here is the text of the royal letter: \"I am the head of state of many nations...\"";
    if (blockText !== expectedText) {
        console.log(indent(2, `Expected first main block text to be '${expectedText}', not '${blockText}'`));
        allPassed = false;
    }
    return allPassed;
}

module.exports = {cpAsBlock, vpAsBlock, mainTextAfterCpVp};
