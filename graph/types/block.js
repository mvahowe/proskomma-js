const {GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLString} = require('graphql');
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
    ret = ["Block:"];
    if (b.bg.length > 0) {
        b.bg.forEach(bbg => ret.push(`   ${bbg[1]} graft to ${bbg[2]}`));
    }
    ret.push(`   Scope ${b.bs[1]}`);
    ret.push(`   ${b.c.map(bci => dumpItem(bci)).join("")}`);
    return ret.join("\n");
}

const blockType = new GraphQLObjectType({
    name: "Block",
    fields: () => ({
        cByteLength: {type: GraphQLInt, resolve: root => root.c.length},
        bgByteLength: {type: GraphQLInt, resolve: root => root.bg.length},
        osByteLength: {type: GraphQLInt, resolve: root => root.os.length},
        c: {type: GraphQLList(itemType), resolve: root => root.c},
        bs: { type: itemType},
        bg: {type: GraphQLList(itemType), resolve: root => root.bg},
        os: {type: GraphQLList(itemType), resolve: root => root.os},
        dump: {type: GraphQLString, resolve: root => dumpBlock(root)}
    })
})

module.exports = blockType;
