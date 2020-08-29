const { labelForScope } = require("../label_for_scope");

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
            newScopes: [
                {
                    label: pt => pt.fullTagName,
                    endedBy: ["baseSequenceChange"],
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
                    "mt"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "title",
            newBlock: true,
            newScopes: [
                {
                    label: pt => pt.fullTagName,
                    endedBy: ["baseSequenceChange"],
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
                    "mte"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "endTitle",
            newBlock: true,
            newScopes: [
                {
                    label: pt => pt.fullTagName,
                    endedBy: ["baseSequenceChange"],
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
                    "rem"
                ]
            ]
        ],
        parser: {
            baseSequenceType: "remark",
            forceNewSequence: true,
            newScopes: [
                {
                    label: pt => pt.fullTagName,
                    endedBy: ["baseSequenceChange"],
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
                    label: pt => labelForScope("inline", pt.fullTagName),
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
                    label: pt => labelForScope("inline", pt.fullTagName),
                    endedBy: ["endTag/x", "endBlock"],
                    onEnd: (parser, label) => parser.returnToBaseSequence()
                }
            ]
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