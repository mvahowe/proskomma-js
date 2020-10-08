const xre = require('xregexp');

const scopeEnum = {
    "blockTag": 0,
    "inline": 1,
    "chapter": 2,
    "pubChapter": 3,
    "altChapter": 4,
    "verses": 5,
    "verse": 6,
    "pubVerse": 7,
    "altVerse": 8,
    "span": 9,
    "table": 10,
    "row": 11,
    "cell": 12,
    "milestone": 13,
    "spanWithAtts": 14,
    "attribute": 15,
    "hangingGraft": 16,
    "orphanTokens": 17
};

const scopeEnumLabels = Object.entries(scopeEnum).sort((a, b) => a[1] - b[1]).map(kv => kv[0]);

const splitTagNumber = fullTagName => {
    const tagBits = xre.exec(fullTagName, xre("([^1-9]+)(.*)"));
    const tagName = tagBits[1];
    const tagNo = tagBits[2].length > 0 ? tagBits[2] : "1";
    return [tagName, tagNo];
}

const cellScope = fullTagName => {
    const tagProps = {
        "th": {
            type: "colHeading",
            align: "left"
        },
        "thr": {
            type: "colHeading",
            align: "right"
        },
        "tc": {
            type: "body",
            align: "left"
        },
        "tcr": {
            type: "body",
            align: "right"
        },
    }
    const [tagName, tagNo] = splitTagNumber(fullTagName);
    let tagField = "1";
    if (tagNo.includes("-")) {
        const [fromN, toN] = tagNo.split("-");
        tagField = `${(parseInt(toN) - parseInt(fromN)) + 1}`;
    }
    return `cell/${tagProps[tagName].type}/${tagProps[tagName].align}/${tagField}`;
}

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
        case "table":
            return "table";
        case "row":
            return `row/${scopeFields[0].startsWith("th") ? "header" : "body"}`;
        case "cell":
            return cellScope(scopeFields[0]);
        case "milestone":
            return `milestone/${scopeFields[0]}`;
        case "spanWithAtts":
            return `spanWithAtts/${scopeFields[0]}`;
        case "attribute":
            return `attribute/${scopeFields[0]}/${scopeFields[1]}/${scopeFields[2]}`;
        case "orphanTokens":
            return `orphanTokens`;
        case "hangingGraft":
            return `hangingGraft`;
        case "pubChapter":
            return `pubChapter/${scopeFields[0]}`;
        case "pubVerse":
            return `pubVerse/${scopeFields[0]}`;
        case "altChapter":
            return `altChapter/${scopeFields[0]}`;
        case "altVerse":
            return `altVerse/${scopeFields[0]}`;
        default:
            throw new Error(`Unknown scope type '${scopeType}' in labelForScope`);
    }
}

const nComponentsForScope = (scopeType) => {
    switch (scopeType) {
        case "orphanTokens":
        case "hangingGraft":
        case "table":
            return 1;
        case "blockTag":
        case "inline":
        case "chapter":
        case "verses":
        case "verse":
        case "span":
        case "row":
        case "milestone":
        case "spanWithAtts":
        case "pubChapter":
        case "altChapter":
        case "pubVerse":
        case "altVerse":
            return 2;
        case "cell":
            return 4;
        case "attribute":
            return 5;
        default:
            throw new Error(`Unknown scope type '${scopeType}' in nComponentsForScope`);
    }
}

module.exports = {scopeEnum, scopeEnumLabels, labelForScope, nComponentsForScope};