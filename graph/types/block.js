const {GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString, GraphQLNonNull} = require('graphql');
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

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        cBL: {type: GraphQLNonNull(GraphQLInt), resolve: root => root.c.length},
        bgBL: {type: GraphQLNonNull(GraphQLInt), resolve: root => root.bg.length},
        osBL: {type: GraphQLNonNull(GraphQLInt), resolve: root => root.os.length},
        isBL: {type: GraphQLNonNull(GraphQLInt), resolve: root => root.is.length},
        cL: {
            type: GraphQLNonNull(GraphQLInt),
            resolve:
                (root, args, context) => context.docSet.countItems(root.c)
        },
        bgL: {
            type: GraphQLNonNull(GraphQLInt),
            resolve:
                (root, args, context) => context.docSet.countItems(root.bg)
        },
        osL: {
            type: GraphQLNonNull(GraphQLInt),
            resolve:
                (root, args, context) => context.docSet.countItems(root.os)
        },
        isL: {
            type: GraphQLNonNull(GraphQLInt),
            resolve:
                (root, args, context) => context.docSet.countItems(root.is)
        },
        is: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(scopeType))),
            resolve:
                (root, args, context) => {
                    return context.docSet.unsuccinctifyScopes(root.is)
                }
        },
        os: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(scopeType))),
            resolve:
                (root, args, context) => {
                    return context.docSet.unsuccinctifyScopes(root.os)
                }
        },
        bs: {
            type: GraphQLNonNull(scopeType),
            resolve:
                (root, args, context) => {
                    const [itemLength, itemType, itemSubtype] = context.docSet.headerBytes(root.bs, 0);
                    return context.docSet.unsuccinctifyScope(root.bs, itemType, itemSubtype, 0);
                }
        },
        bg: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(graftType))),
            resolve:
                (root, args, context) => {
                    return context.docSet.unsuccinctifyGrafts(root.bg)
                }
        },
        items: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
            args: {
                withScopes: {type: GraphQLList(GraphQLString)},
                withScriptureCV: {type: GraphQLString}
            },
            resolve:
                (root, args, context) => {
                    if (args.withScopes && args.withScriptureCV) {
                        throw new Error("Cannot specify both withScopes and withScriptureCV");
                    }
                    if (args.withScriptureCV) {
                        return context.docSet.unsuccinctifyItemsWithScriptureCV(root, args.withScriptureCV);
                    } else {
                        return context.docSet.unsuccinctifyPrunedItems(
                            root,
                            {
                                tokens: true,
                                scopes: true,
                                grafts: true,
                                requiredScopes: args.withScopes || []
                            }
                        )
                    }
                }
        },
        tokens: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(tokenType))),
            args: {
                withScriptureCV: {type: GraphQLString}
            },
            resolve:
                (root, args, context) => {
                    if (args.withScriptureCV) {
                        return context.docSet.unsuccinctifyItemsWithScriptureCV(root, args.withScriptureCV, {tokens: true});
                    } else {
                        return context.docSet.unsuccinctifyItems(root.c, {tokens: true});
                    }
                }
        },
        text: {
            type: GraphQLNonNull(GraphQLString),
            resolve:
                (root, args, context) => {
                    return context.docSet.unsuccinctifyItems(root.c, {tokens: true})
                        .map(t => t[2])
                        .join('')
                        .trim()
                }
        },
        dump: {
            type: GraphQLNonNull(GraphQLString),
            resolve:
                (root, args, context) => {
                    return dumpBlock(context.docSet.unsuccinctifyBlock(root, {}));
                }
        },
        html: {
            type: GraphQLNonNull(GraphQLString),
            resolve:
                (root, args, context) => {
                    return html4Block(context.docSet.unsuccinctifyBlock(root, {}));
                }
        },
        scopeLabels: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
            resolve:
                (root, args, context) =>
                    [...context.docSet.unsuccinctifyBlockScopeLabelsSet(root)]
        },
    })
})

module.exports = blockType;
