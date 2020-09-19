const { labelForScope } = require("./scope_defs");

const specs = [
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "id",
                    "usfm",
                    "ide",
                    "sts",
                    "h",
                    "toc",
                    "toca"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "header",
            forceNewSequence: true,
            newBlock: true,
            useTempSequence: true,
            newScopes: [
                {
                    label: pt => pt.fullTagName,
                    endedBy: ["baseSequenceChange"],
                    onEnd: (parser, label) => {
                        parser.headers[label] = parser.current.sequence.plainText();
                    }
                }
            ]
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "ms",
                    "mr",
                    "s",
                    "sr",
                    "r",
                    "qa",
                    "sp",
                    "sd"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "heading",
            forceNewSequence: true,
            newBlock: true,
            newScopes: []
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "mt"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "title",
            newBlock: true,
            newScopes: []
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "mte"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "endTitle",
            newBlock: true,
            newScopes: []
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "rem"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "remark",
            forceNewSequence: true,
            newScopes: []
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "cd",
                    "p",
                    "m",
                    "po",
                    "pr",
                    "cls",
                    "pmo",
                    "pm",
                    "pmc",
                    "pmr",
                    "pi",
                    "mi",
                    "nb",
                    "pc",
                    "ph",
                    "b",
                    "q",
                    "qr",
                    "qc",
                    "qa",
                    "qm",
                    "qd",
                    "lh",
                    "li",
                    "lf",
                    "lim",
                    "d"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "main",
            newBlock: true,
            newScopes: []
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "f",
                    "fe"
                ]
            ]
        ],
        parser: {
            inlineSequenceType: "footnote",
            forceNewSequence: true,
            newScopes: [
                {
                    label: pt => labelForScope("inline", [pt.fullTagName]),
                    endedBy: ["endTag/f", "endTag/fe", "endBlock"],
                    onEnd: (parser, label) => parser.returnToBaseSequence()
                }
            ]
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "x"
                ]
            ]
        ],
        parser: {
            inlineSequenceType: "xref",
            forceNewSequence: true,
            newScopes: [
                {
                    label: pt => labelForScope("inline", [pt.fullTagName]),
                    endedBy: ["endTag/x", "endBlock"],
                    onEnd: (parser, label) => parser.returnToBaseSequence()
                }
            ]
        }
    },
    {
        contexts: [
            ["chapter"]
        ],
        parser: {
            mainSequence: true,
            newScopes: [
                {
                    label: pt => labelForScope("chapter", [pt.number]),
                    endedBy: ["chapter"]
                }
            ]
        }
    },
    {
        contexts: [
            ["verses"]
        ],
        parser: {
            mainSequence: true,
            newScopes: [
                {
                    label: pt => labelForScope("verses", [pt.numberString]),
                    endedBy: ["verses", "chapter"]
                }
            ],
            during: (parser, pt) => {
                pt.numbers.map(n => {
                        const verseScope = {
                            label: pt => labelForScope("verse", [n]),
                            endedBy: ["verses", "chapter"]
                        };
                        parser.openNewScope(pt, verseScope);
                    }
                );
            }
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "qs",
                    "qac",
                    "litl",
                    "lik",
                    "liv",
                    "fv",
                    "fdc",
                    "fm",
                    "xop",
                    "xot",
                    "xnt",
                    "xdc",
                    "add",
                    "bk",
                    "dc",
                    "k",
                    "nd",
                    "ord",
                    "pn",
                    "png",
                    "qt",
                    "sig",
                    "sls",
                    "tl",
                    "wj",
                    "em",
                    "bd",
                    "it",
                    "bdit",
                    "no",
                    "sc",
                    "sup"
                ]
            ]
        ],
        parser: {
            newScopes: [
                {
                    label: pt => labelForScope("span", [pt.fullTagName]),
                    endedBy: ["endBlock", "endTag/$fullTagName$"]
                }
            ]
        }
    },
    {
        contexts: [
            ["emptyMilestone"]
        ],
        parser: {
            during: (parser, pt) => parser.addEmptyMilestone(labelForScope("milestone", [pt.tagName]))
        }
    },
    {
        contexts: [
            ["startMilestoneTag", "sOrE", "s"]
        ],
        parser: {
            newScopes: [
                {
                    label: pt => labelForScope("milestone", [pt.tagName]),
                    endedBy: ["endMilestone/$tagName$"]
                }
            ],
            during: (parser, pt) => {
                if (pt.sOrE === "s") {
                    parser.setAttributeContext(labelForScope("milestone", [pt.tagName]))
                }
            }
        }
    },
    {
        contexts: [
            ["endMilestoneMarker"]
        ],
        parser: {
            during: (parser, pt) => parser.clearAttributeContext()
        }
    },
    {
        contexts: [
            ["attribute"]
        ],
        parser: {
            during: (parser, pt) => {
                pt.values.map(a => {
                        const attScope = {
                            label: pt => labelForScope("attribute", [parser.current.attributeContext, pt.key, a]),
                            endedBy: [`$attributeContext$`]
                        };
                        parser.openNewScope(pt, attScope);
                    }
                );
            }
        }
    },
    {
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "w",
                    "rb",
                    "xt",
                    "fig"
                ]
            ]
        ],
        parser: {
            newScopes: [
                {
                    label: pt => labelForScope("spanWithAtts", [pt.tagName]),
                    endedBy: ["endBlock", "endTag/$tagName$"],
                    onEnd: (parser, label) => parser.clearAttributeContext()
                }
            ],
            during: (parser, pt) => {
                parser.setAttributeContext(labelForScope("spanWithAtts", [pt.tagName]))
            }
        }
    },
    {
        contexts: [
            ["wordLike"],
            ["lineSpace"],
            ["punctuation"],
            ["eol"]
        ],
        parser: {
            during: (parser, pt) => parser.addToken(pt)
        }
    }
];

module.exports = { specs }