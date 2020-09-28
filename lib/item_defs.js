const itemEnum = {
    token: 0,
    graft: 1,
    startScope: 2,
    endScope: 3
};

const itemEnumLabels = Object.entries(itemEnum).sort((a, b) => a[1] - b[1]).map(kv => kv[0]);


module.exports = { itemEnum, itemEnumLabels };