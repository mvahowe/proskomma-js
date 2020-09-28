const { sequencesByType, indent, hasRangeCalled } = require("../utils");

const verseRange = (tokenized) => {
    let allPassed = true;
    const firstMainToken = sequencesByType(tokenized, "main")[0].blocks[0].tokens[0];
    if (!hasRangeCalled("start", "milestone/verses/1-2", firstMainToken )) {
        console.log(indent(2, "No verses 1-2 milestone found for first token of main sequence"));
        allPassed = false;
    } else if (!hasRangeCalled("start", "milestone/verse/1", firstMainToken )) {
        console.log(indent(2, "No verse 1 milestone found for first token of main sequence"));
        allPassed = false;
    } else if (!hasRangeCalled("start", "milestone/verse/2", firstMainToken )) {
    console.log(indent(2, "No verse 1 milestone found for first token of main sequence"));
    allPassed = false;
}
    return allPassed;
}

export { verseRange };
