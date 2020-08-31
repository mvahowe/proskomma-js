const labelForScope = (scopeType, scopeFields) => {
    switch (scopeType) {
        case "blockTag":
            return `block/${scopeFields[0]}`;
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
        case "attribute":
            return `attribute/${scopeFields[0]}/${scopeFields[1]}/${scopeFields[2]}`
        default:
            throw new Error(`Unknown scope type '${scopeType}' in labelForScope`);
    }
}

module.exports = { labelForScope };