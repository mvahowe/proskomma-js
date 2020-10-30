const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull} = require('graphql');

const blockType = require('./block');

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

const sequenceType = new GraphQLObjectType({
    name: "Sequence",
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLString)},
        type: {type: GraphQLNonNull(GraphQLString)},
        nBlocks: {type: GraphQLNonNull(GraphQLInt), resolve: root => root.blocks.length},
        htmlHead: {type: GraphQLNonNull(GraphQLString), resolve: root => htmlHead(root)},
        htmlFoot: {type: GraphQLNonNull(GraphQLString), resolve: root => htmlFoot(root)},
        blocks: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(blockType))),
            args: {
                withScopes: {type: GraphQLList(GraphQLNonNull(GraphQLString))},
                withScriptureCV: {type: GraphQLString}
            },
            resolve: (root, args, context) => {
                context.docSet.maybeBuildEnumIndexes();
                if (args.withScopes && args.withScriptureCV) {
                    throw new Error("Cannot specify both withScopes and withScriptureCV");
                }
                if (args.withScopes) {
                    return root.blocks.filter(b => context.docSet.allScopesInBlock(b, args.withScopes));
                } else if (args.withScriptureCV) {
                    return context.docSet.blocksWithScriptureCV(root.blocks, args.withScriptureCV);
                } else {
                    return root.blocks;
                }
            }
        }
    })
})

module.exports = sequenceType;
