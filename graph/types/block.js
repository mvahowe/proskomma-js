const {GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString} = require('graphql');
const itemType = require('./item');
const scopeType = require('./scope');
const graftType = require('./graft');

const dumpItem = i => {
    switch (i[0]) {
        case "token":
            return `|${i[2]}`;
        case "startScope":
            return `+${i[1]}+`;
        case "endScope":
            return `-${i[1]}-`;
        case "graft":
            return `>${i[1]}<`;
    }
}

const dumpBlock = b => {
    const ret = ["Block:"];
    if (b.bg.length > 0) {
        b.bg.forEach(bbg => ret.push(`   ${bbg[1]} graft to ${bbg[2]}`));
    }
    ret.push(`   Scope ${b.bs[1]}`);
    ret.push(`   ${b.c.map(bci => dumpItem(bci)).join("")}`);
    return ret.join("\n");
}

const scope2class = c => c.replace("/", "-").toLowerCase();

const html4Item = i => {
    if (i[0] === "token") {
        return i[2];
    } else if (i[0].startsWith("start") && i[1].startsWith("chapter/")) {
        const chNo = i[1].split("/")[1];
        return `<span class="chapter">${chNo}</span>`;
    } else if (i[0].startsWith("start") && i[1].startsWith("verses/")) {
        const vNo = i[1].split("/")[1];
        if (vNo !== "1") {
            return `<span class="verses">${vNo}</span>`;
        }
    }
}

const html4Block = b => {
    const ret = [];
    b.bg.forEach(bgi => ret.push(`<h3>Graft ${bgi[1]} ${bgi[2]}</h3>\n`));
    ret.push(`<div class="${scope2class(b.bs[1])}">`);
    b.c.filter(ci => ci[0] !== 'graft').forEach(i => ret.push(html4Item(i)));
    ret.push("</div>\n")
    return ret.join('');
}

const blockText = b => {
    return b.c.filter(i => i[0] === 'token').map(t => t[2]).join('');
}

const scopeLabels = r => {
    return [...new Set([...r.os, ...r.is].map(ri => ri[1]))];
}

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        cByteLength: {type: GraphQLInt, resolve: root => root.c.length},
        bgByteLength: {type: GraphQLInt, resolve: root => root.bg.length},
        osByteLength: {type: GraphQLInt, resolve: root => root.os.length},
        isByteLength: {type: GraphQLInt, resolve: root => root.is.length},
        c: {type: GraphQLList(itemType), resolve: root => root.c},
        bs: { type: scopeType},
        bg: {type: GraphQLList(graftType), resolve: root => root.bg},
        os: {type: GraphQLList(scopeType), resolve: root => root.os},
        is: {type: GraphQLList(scopeType), resolve: root => root.is},
        dump: {type: GraphQLString, resolve: root => dumpBlock(root)},
        text: {type: GraphQLString, resolve: root => blockText(root)},
        html: {type: GraphQLString, resolve: root => html4Block(root)},
        scopeLabels: {type: GraphQLList(GraphQLString), resolve: root=> scopeLabels(root)}
    })
})

module.exports = blockType;
