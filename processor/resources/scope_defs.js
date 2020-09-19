const scopeEnum = {
    "blockTag": 0,
    "inline": 1,
    "chapter": 2,
    "verses": 3,
    "verse": 4,
    "span": 5,
    "milestone": 6,
    "spanWithAtts": 7,
    "attribute": 8,
    "orphanTokens": 9
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