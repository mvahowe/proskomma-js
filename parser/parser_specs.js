const {labelForScope} = require("../lib/scope_defs");
const {generateId} = require("../lib/generate_id");

const specs = [
    {
        // HEADERS - make temp sequence, then add to headers object
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
        // HEADINGS - Start new sequence
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
        // TITLE - make a sequence or add to existing one
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
        // END TITLE - make a sequence or add to existing one
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
        // INTRODUCTION - make a sequence or add to existing one
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "imt",
                    "is",
                    "ip",
                    "ipi",
                    "im",
                    "imi",
                    "ipq",
                    "imq",
                    "ipr",
                    "iq",
                    "ib",
                    "ili",
                    "iot",
                    "io",
                    "iex",
                    "imte",
                ]
            ]
        ],
        parser: {
            baseSequenceType: "introduction",
            newBlock: true,
            newScopes: []
        }
    },
    {
        // REMARK - make new sequence
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
        // PARAGRAPH STYLES - Make new block on main
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
        // ROW - Make new block
        contexts: [
            [
                "startTag",
                "tagName",
                ["tr"]
            ]
        ],
        parser: {
            newBlock: true,
            newScopes: []
        }
    },
    {
        // FOOTNOTE/ENDNOTE - new inline sequence
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
                    onEnd: (parser) => parser.returnToBaseSequence()
                }
            ]
        }
    },
    {
        // CROSS REFERENCE - make new inline sequence
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
                    onEnd: (parser) => parser.returnToBaseSequence()
                }
            ]
        }
    },
    {
        // CHAPTER - chapter scope
        contexts: [["chapter"]],
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
        // CP - graft label and add stub scope, then remove graft and modify scope at tidy stage
        contexts: [["pubchapter"]],
        parser: {
            mainSequence: true,
            newScopes: [
                {
                    label: pt => labelForScope("pubChapter", [pt.numberString]),
                    endedBy: ["pubchapter", "chapter"]
                }
            ]
        }
    },
    {
        // CA - graft label and add stub scope, then remove graft and modify scope at tidy stage
        contexts: [
            [
                "startTag",
                "tagName",
                ["ca"]
            ]
        ],
        parser: {
            inlineSequenceType: "altNumber",
            forceNewSequence: true,
            newScopes: [
                {
                    label: pt => labelForScope("inline", [pt.fullTagName]),
                    endedBy: ["endTag/ca", "endBlock", "implicitEnd"],
                    onEnd: (parser) => parser.returnToBaseSequence()
                }
            ],
            during: (parser, pt) => {
                const scopeId = generateId();
                const vpScope = {
                    label: () => labelForScope("altChapter", [scopeId]),
                    endedBy: ["startTag/ca", "chapter"]
                };
                parser.openNewScope(pt, vpScope, true, parser.sequences.main);
            }
        }
    },
    {
        // VERSES - verse and verses scopes
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
                            label: () => labelForScope("verse", [n]),
                            endedBy: ["verses", "chapter"]
                        };
                        parser.openNewScope(pt, verseScope, true, parser.sequences.main);
                    }
                );
            }
        }
    },
    {
        // VP - graft label and add stub scope, then remove graft and modify scope at tidy stage
        contexts: [
            [
                "startTag",
                "tagName",
                ["vp"]
            ]
        ],
        parser: {
            inlineSequenceType: "pubNumber",
            forceNewSequence: true,
            newScopes: [
                {
                    label: pt => labelForScope("inline", [pt.fullTagName]),
                    endedBy: ["endTag/vp", "endBlock", "implicitEnd"],
                    onEnd: (parser) => parser.returnToBaseSequence()
                }
            ],
            during: (parser, pt) => {
                const scopeId = generateId();
                const vpScope = {
                    label: () => labelForScope("pubVerse", [scopeId]),
                    endedBy: ["startTag/vp", "verses", "chapter"]
                };
                parser.openNewScope(pt, vpScope, true, parser.sequences.main);
            }
        }
    },
    {
        // VA - graft label and add stub scope, then remove graft and modify scope at tidy stage
        contexts: [
            [
                "startTag",
                "tagName",
                ["va"]
            ]
        ],
        parser: {
            inlineSequenceType: "altNumber",
            forceNewSequence: true,
            newScopes: [
                {
                    label: pt => labelForScope("inline", [pt.fullTagName]),
                    endedBy: ["endTag/va", "endBlock", "implicitEnd"],
                    onEnd: (parser) => parser.returnToBaseSequence()
                }
            ],
            during: (parser, pt) => {
                const scopeId = generateId();
                const vpScope = {
                    label: () => labelForScope("altVerse", [scopeId]),
                    endedBy: ["startTag/va", "verses", "chapter"]
                };
                parser.openNewScope(pt, vpScope, true, parser.sequences.main);
            }
        }
    },
    {
        // CHARACTER MARKUP - add scope
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
                    "fr",
                    "fq",
                    "fqa",
                    "fk",
                    "fl",
                    "fw",
                    "fp",
                    "fv",
                    "ft",
                    "fdc",
                    "fm",
                    "xo",
                    "xk",
                    "xq",
                    "xt",
                    "xta",
                    "xop",
                    "xot",
                    "xnt",
                    "xdc",
                    "rq",
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
                    "sup",
                    "ior",
                    "iqt"
                ]
            ]
        ],
        parser: {
            newScopes: [
                {
                    label: pt => labelForScope("span", [pt.fullTagName]),
                    endedBy: ["endBlock", "endTag/$fullTagName$", "implicitEnd"]
                }
            ]
        }
    },
    {
        // CELL - unpick tagName, add scope
        contexts: [
            [
                "startTag",
                "tagName",
                [
                    "th",
                    "thr",
                    "tc",
                    "tcr"
                ]
            ]
        ],
        parser: {
            newScopes: [
                {
                    label: pt => labelForScope("cell", [pt.fullTagName]),
                    endedBy: ["endBlock", "endTag/$fullTagName$"]
                }
            ]
        }
    },
    {
        // EMPTY MILESTONE - add open and close scope
        contexts: [
            ["emptyMilestone"]
        ],
        parser: {
            during: (parser, pt) => parser.addEmptyMilestone(labelForScope("milestone", [pt.tagName]))
        }
    },
    {
        // START MILESTONE - open scope, set attribute context
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
        // END MILESTONE - close scope, clear attribute context
        contexts: [
            ["endMilestoneMarker"]
        ],
        parser: {
            during: (parser) => parser.clearAttributeContext()
        }
    },
    {
        // ATTRIBUTE - open scope based on attribute context
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
        // WORD-LEVEL MARKUP - open scope and set attribute context
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
                    onEnd: (parser) => parser.clearAttributeContext()
                }
            ],
            during: (parser, pt) => {
                parser.setAttributeContext(labelForScope("spanWithAtts", [pt.tagName]))
            }
        }
    },
    {
        // TOKEN - add a token!
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

module.exports = {specs}