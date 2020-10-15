const {GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString} = require('graphql');
const tokenType = require('./token');
const scopeType = require('./scope');
const graftType = require('./graft');
const itemType = require('./item');

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

const succinctBlockType = new GraphQLObjectType({
    name: "SuccinctBlock",
    fields: () => ({
        cBL: {type: GraphQLInt, resolve: root => root.c.length},
        bgBL: {type: GraphQLInt, resolve: root => root.bg.length},
        osBL: {type: GraphQLInt, resolve: root => root.os.length},
        isBL: {type: GraphQLInt, resolve: root => root.is.length},
        cL: {
            type: GraphQLInt,
            resolve:
                (root, args, context) => context.docSet.countItems(root.c)
        },
        bgL: {
            type: GraphQLInt,
            resolve:
                (root, args, context) => context.docSet.countItems(root.bg)
        },
        osL: {
            type: GraphQLInt,
            resolve:
                (root, args, context) => context.docSet.countItems(root.os)
        },
        isL: {
            type: GraphQLInt,
            resolve:
                (root, args, context) => context.docSet.countItems(root.is)
        },
        is: {
            type: GraphQLList(scopeType),
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return context.docSet.unsuccinctifyScopes(root.is)
                }
        },
        os: {
            type: GraphQLList(scopeType),
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return context.docSet.unsuccinctifyScopes(root.os)
                }
        },
        bs: {
            type: scopeType,
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    const [itemLength, itemType, itemSubtype] = context.docSet.headerBytes(root.bs, 0);
                    return context.docSet.unsuccinctifyScope(root.bs, itemType, itemSubtype, 0);
                }
        },
        bg: {
            type: GraphQLList(graftType),
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return context.docSet.unsuccinctifyGrafts(root.bg)
                }
        },
        items: {
            type: GraphQLList(itemType),
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return context.docSet.unsuccinctifyItems(root.c, {})
                }
        },
        tokens: {
            type: GraphQLList(tokenType),
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return context.docSet.unsuccinctifyItems(root.c, {token: true})
                }
        },
        text: {
            type: GraphQLString,
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return context.docSet.unsuccinctifyItems(root.c, {token: true})
                        .map(t => t[2])
                        .join('')
                        .trim()
                }
        },
        dump: {
            type: GraphQLString,
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return dumpBlock(context.docSet.unsuccinctifyBlock(root, {}));
                }
        },
        html: {
            type: GraphQLString,
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return html4Block(context.docSet.unsuccinctifyBlock(root, {}));
                }
        },
        scopeLabels: {
            type: GraphQLList(GraphQLString),
            resolve:
                (root, args, context) => {
                    context.docSet.maybeBuildEnumIndexes();
                    return [...new Set(
                        context.docSet.unsuccinctifyScopes(root.os).concat(
                            context.docSet.unsuccinctifyScopes(root.is)
                        )
                    .map(ri => ri[1]))];
                }
        },
    })
})

module.exports = succinctBlockType;
