const scopeEnum = {
    "blockTag": 0,
    "inline": 1,
    "chapter": 2,
    "printChapter": 3,
    "verses": 4,
    "verse": 5,
    "printVerse": 6,
    "span": 7,
    "milestone": 8,
    "spanWithAtts": 9,
    "attribute": 10,
    "orphanTokens": 11
};

const scopeEnumLabels = Object.entries(scopeEnum).sort((a, b) => a[1] - b[1]).map(kv => kv[0]);

const labelForScope = (scopeType, scopeFields) => {
    switch (scopeType) {
        case "blockTag":
            return `blockTag/${scopeFields[0]}`;
        case "inline":
            return `inline/${scopeFields[0]}`;
        case "chapter":
            return `chapter/${scopeFields[0]}`;
        case "verses":
            return `verses/${scopeFields[0]}`;
        case "verse":
            return `verse/${scopeFields[0]}`;
        case "span":
            return `span/${scopeFields[0]}`;
        case "milestone":
            return `milestone/${scopeFields[0]}`
        case "spanWithAtts":
            return `spanWithAtts/${scopeFields[0]}`
        case "attribute":
            return `attribute/${scopeFields[0]}/${scopeFields[1]}/${scopeFields[2]}`
        case "orphanTokens":
            return `orphanTokens`
        case "printChapter":
            return `printChapter/${scopeFields[0]}`
        case "printVerse":
            return `printVerse/${scopeFields[0]}`
        default:
            throw new Error(`Unknown scope type '${scopeType}' in labelForScope`);
    }
}

const nComponentsForScope = (scopeType) => {
    switch (scopeType) {
        case "blockTag":
        case "inline":
        case "chapter":
        case "verses":
        case "verse":
        case "span":
        case "milestone":
        case "spanWithAtts":
        case "printChapter":
        case "printVerse":
            return 2;
        case "attribute":
            return 5;
        case "orphanTokens":
            return 1;
        default:
            throw new Error(`Unknown scope type '${scopeType}' in nComponentsForScope`);
    }
}

module.exports = {scopeEnum, scopeEnumLabels, labelForScope, nComponentsForScope};