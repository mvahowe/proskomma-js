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
            inlineSequenceType: null,
            forceNewSequence: true,
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
            inlineSequenceType: null,
            forceNewSequence: true,
            useTempSequence: false,
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
            inlineSequenceType: null,
            forceNewSequence: false,
            useTempSequence: false,
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
            inlineSequenceType: null,
            forceNewSequence: false,
            useTempSequence: false,
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
            inlineSequenceType: null,
            forceNewSequence: false,
            useTempSequence: false,
            newScopes: [],
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