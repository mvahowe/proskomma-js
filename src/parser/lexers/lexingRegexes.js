import xre from 'xregexp';

const lexingRegexes = [
    [
        "chapter",
        "chapter",
        xre("([\\r\\n]*\\\\c[ \\t]+(\\d+)[ \\t\\r\\n]*)")
    ],
    [
        "pubchapter",
        "pubchapter",
        xre("([\\r\\n]*\\\\cp[ \\t]+([^\\r\\n]+)[ \\t\\r\\n]*)")
    ],
    [
        "verses",
        "verses",
        xre("([\\r\\n]*\\\\v[ \\t]+([\\d\\-]+)[ \\t\\r\\n]*)")
    ],
    [
        "attribute",
        "attribute",
        xre("([ \\t]*\\|?[ \\t]*([A-Za-z0-9\\-]+)=\"([^\"]*)\"[ \\t]?)")
    ],
    [
        "milestone",
        "emptyMilestone",
        xre("(\\\\([a-z1-9]+)\\\\[*])")
    ],
    [
        "milestone",
        "startMilestoneTag",
        xre("(\\\\([a-z1-9]+)-([se]))")
    ],
    [
        "milestone",
        "endMilestoneMarker",
        xre("(\\\\([*]))")
    ],
    [
        "tag",
        "endTag",
        xre("(\\\\([+]?[a-z\\-]+)([1-9]?(-([1-9]))?)[*])")
    ],
    [
        "tag",
        "startTag",
        xre("(\\\\([+]?[a-z\\-]+)([1-9]?(-([1-9]))?)[ \\t]?)")
    ],
    [
        "bad",
        "bareSlash",
        xre("(\\\\)")
    ],
    [
        "printable",
        "eol",
        xre("([ \\t]*[\\r\\n]+[ \\t]*)")
    ],
    [
        "break",
        "noBreakSpace",
        xre("~")
    ],
    [
        "break",
        "softLineBreak",
        xre("//")
    ],
    [
        "printable",
        "wordLike",
        xre("([\\p{Letter}\\p{Number}\\p{Mark}\\u2060]{1,127})")
    ],
    [
        "printable",
        "lineSpace",
        xre("([\\p{Separator}]{1,127})")
    ],
    [
        "printable",
        "punctuation",
        xre("([\\p{Punctuation}+®])")
    ],
    [
        "bad",
        "unknown",
        xre("(.)")
    ]
];

const mainRegex = xre.union(
    lexingRegexes.map(x => x[2])
);

module.exports = { lexingRegexes, mainRegex }
