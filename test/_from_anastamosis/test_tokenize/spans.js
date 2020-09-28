const {sequencesByType, hasRangeCalled, indent} = require("../utils");

const spansPresent = (tokenized) => {
    let allPassed = true;
    const mainSeqs = sequencesByType(tokenized, "main");
    const firstBlock = mainSeqs[0].blocks[0];
    for (const [tChars, starting, ending] of [
        ["Lord", ["nd"], ["nd"]],
        ["Joel", ["it", "bd"], ["bd"]],
        ["Pethuel", [], ["it"]]
    ]) {
        const charsTokens = firstBlock.tokens.filter(t => t.chars === tChars);
        if (charsTokens.length !== 1) {
            console.log(indent(2, `Expected exactly 1 token with chars of '${tChars}', found '${charsTokens.length}'`));
            allPassed = false;
        } else {
            const wordToken = charsTokens[0];
            const tokenStartRanges = wordToken.properties.ranges.start || [];
            if (starting.length !== tokenStartRanges.length) {
                console.log(indent(2, `Expected exactly ${starting.length} start range(s) for '${tChars}', found '${tokenStartRanges.length}'`));
                allPassed = false;
            }
            for (const tag of starting) {
                if (!hasRangeCalled("start", `span/${tag}`, wordToken)) {
                    console.log(indent(2, `Start range 'span/${tag}' not found for '${tChars}'`));
                    allPassed = false;
                }
            }
            const tokenEndRanges = wordToken.properties.ranges.end || [];
            if (ending.length !== tokenEndRanges.length) {
                console.log(indent(2, `Expected exactly ${starting.length} end range(s) for '${tChars}', found '${tokenEndRanges.length}'`));
                allPassed = false;
            }
            for (const tag of ending) {
                if (!hasRangeCalled("end", `span/${tag}`, wordToken)) {
                    console.log(indent(2, `End range 'span/${tag}' not found for '${tChars}'`));
                    allPassed = false;
                }
            }
        }
    }
    return allPassed;
}

module.exports = { spansPresent };
