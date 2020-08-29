const xre = require('xregexp');

const ptClasses = require('./preTokenClasses');
const lexingRegexes = require('./resources/lexingRegexes');

const mainRegex = xre.union(
    lexingRegexes.map(x => x[2])
);

const classForFragment = {
    printable: ptClasses.PrintablePT,
    chapter: ptClasses.ChapterPT,
    verses: ptClasses.VersesPT,
    tag: ptClasses.TagPT,
    break: ptClasses.BreakPT,
    milestone: ptClasses.MilestonePT,
    attribute: ptClasses.AttributePT,
    bad: ptClasses.BadPT
};

const preTokenClassForFragment = (fragment) => {
    for (const lexingRegex of lexingRegexes) {
        let [tClass, tSubclass, tRE] = lexingRegex;
        let matchedBits = xre.exec(fragment, tRE, 0, "sticky");
        if (matchedBits) {
            return new classForFragment[tClass](tSubclass, matchedBits);
        }
    }
    throw new Error(`Could not match preToken fragment '${fragment}'`);
}

const lexify = (str) => {
    return xre.match(str, mainRegex, "all").map(f => preTokenClassForFragment(f));
}

module.exports = { lexify };