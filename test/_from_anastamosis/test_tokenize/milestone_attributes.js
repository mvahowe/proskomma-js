const { graftsStartingWith, sequencesByType, indent, hasRangeCalled } = require("../utils");

const startAndEndMilestoneMarkersPresent = (tokenized) => {
    let allPassed = true;
    const mainSequenceBlock = sequencesByType(tokenized, "main")[0].blocks[0];
    const firstMainToken = mainSequenceBlock.tokens[0];
    if (!hasRangeCalled("start", "milestone/zaln", firstMainToken )) {
        console.log(indent(2, "zaln start milestone not found for first token of main sequence"));
        allPassed = false;
    } else {
        const zalnStartGraftTypes = graftsStartingWith("attribute/zaln/start/", firstMainToken).map(g => g.split("/")[3]);
        for (const graftType of ["x-strong", "x-lemma", "x-morph", "x-occurrence", "x-occurrences", "x-content"]) {
            if (!zalnStartGraftTypes.includes(graftType)) {
                console.log(indent(2, `zaln start attribute graft for '${graftType}' not found`));
                allPassed = false;
            }
        }
    }
    const visionTokens = mainSequenceBlock.tokens.filter(t => t.chars === "vision");
    if (visionTokens.length !== 1) {
        console.log(indent(2, `Expected exactly 1 token with chars of 'vision', found '${visionTokens.length}'`));
        allPassed = false;
    } else if (!hasRangeCalled("start", "spanWithAtts/w", visionTokens[0])) {
        console.log(indent(2, "w start milestone not found for token with chars of 'vision'"));
        allPassed = false;
    } else if (!hasRangeCalled("end", "spanWithAtts/w", visionTokens[0])) {
        console.log(indent(2, "w end milestone not found for token with chars of 'vision'"));
        allPassed = false;
    }else {
        const wGraftTypes = graftsStartingWith("attribute/", visionTokens[0]).map(g => g.split("/")[2]);
        for (const graftType of ["x-occurrence", "x-occurrences"]) {
            if (!wGraftTypes.includes(graftType)) {
                console.log(indent(2, `w start attribute graft for '${graftType}' not found`));
                allPassed = false;
            }
        }
    }
    return allPassed;
}

export { startAndEndMilestoneMarkersPresent };
