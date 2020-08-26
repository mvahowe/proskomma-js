const specs = [
    {
        contexts: [
            ["startTag", "tagName", "id"],
            ["startTag", "tagName", "usfm"],
            ["startTag", "tagName", "ide"],
            ["startTag", "tagName", "sts"],
            ["startTag", "tagName", "h"],
            ["startTag", "tagName", "toc"],
            ["startTag", "tagName", "toca"]
        ],
        parser: {
            baseSequenceType: "header",
            inlineSequenceType: null,
            forceNewSequence: true,
            useTempSequence: true,
            newScopes: [
                {
                    label: pt => pt.fullTagName,
                    endedBy: [],
                    onEnd: (parser, pt, label) => {
                        parser.headers[label] = parser.sequences.temp.plainText();
                        parser.sequences.temp = null;
                    }
                }
            ]
        }
    }
];

module.exports = { specs }