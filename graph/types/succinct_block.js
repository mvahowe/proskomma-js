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
    })
})

module.exports = succinctBlockType;
