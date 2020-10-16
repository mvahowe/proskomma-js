const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

// const blockType = require('./oldBlock');
const succinctBlockType = require('./succinct_block');

const htmlStyles = ".blocktag-q1 {font-family: italic}" +
    ".blocktag-q2 {font-family: italic; padding-left: 2em}" +
    ".blocktag-b1 {min-height: 1em}" +
    ".blocktag-d1 {font-weight: bold}" +
    ".chapter {font-size: xx-large; font-weight: bold; padding-right: 0.2em}" +
    ".verses {font-size: x-small; font-weight: bold; padding-right: 0.2em}"

const htmlHead = (s => {
    return `<html>\n<head>\n<title>Sequence ${s.id}</title>\n<style>${htmlStyles}</style></head>\n<body>\n<h1>Sequence ${s.id}</h1>`;
})

const htmlFoot = s => {
    return "</body>\n</html>\n";
}

const scopesInBlock = (docSet, block, scopes) => {
    const allBlockScopes = [
        ...new Set([
            ...docSet.unsuccinctifyScopes(block.os).map(s => s[1]),
            ...docSet.unsuccinctifyScopes(block.is).map(s => s[1])
        ])
    ];
    for (const scope of scopes) {
        if (!allBlockScopes.includes(scope)) {
            return false;
        }
    }
    return true;
}

const sequenceType = new GraphQLObjectType({
    name: "Sequence",
    fields: () => ({
        id: {type: GraphQLString},
        type: {type: GraphQLString},
        nBlocks: {type: GraphQLInt, resolve: root => root.blocks.length},
        htmlHead: {type: GraphQLString, resolve: root => htmlHead(root)},
        htmlFoot: {type: GraphQLString, resolve: root => htmlFoot(root)},
        blocksForScopes: {
            type: GraphQLList(succinctBlockType),
            args: {
                scopes: {type: GraphQLList(GraphQLString)}
            },
            resolve: (root, args, context) =>
                root.blocks.filter(b => scopesInBlock(context.docSet, b, args.scopes))
        },
        blocks: {
            type: GraphQLList(succinctBlockType),
            resolve: (root, args, context) => {
                context.docSet.maybeBuildEnumIndexes();
                return root.blocks;
            }
        }
    })
})

module.exports = sequenceType;
