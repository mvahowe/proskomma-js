const itemEnum = {
    token: 0,
    graft: 1,
    startScope: 2,
    endScope: 3
};

const itemEnumLabels = Object.entries(itemEnum).sort((a, b) => a[1] - b[1]).map(kv => kv[0]);

const itemArray2Object = a => ({
    type: a[0],
    subType: a[1],
    payload: a[2],
});

const itemObject2Array = ob => [
    ob.type,
    ob.subType,
    ob.payload,
];

const itemArrays2Objects = aa => aa.map(a => itemArray2Object(a));

const itemObjects2Arrays = obs => obs.map(ob => itemObject2Array(ob));

export {
    itemEnum,
    itemEnumLabels,
    itemArray2Object,
    itemObject2Array,
    itemArrays2Objects,
    itemObjects2Arrays,
};
