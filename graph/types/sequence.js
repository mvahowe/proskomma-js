const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull} = require('graphql');
const xre = require('xregexp');

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

const blockHasStrongs = (docSet, block, strongs, requireAll) => {

    const cleanStrong= (s) => {
        return xre.match(s, xre("[HG][0-9]+"));
    }

    if (strongs.length === 0) {
        return true;
    }
    let matched = new Set([]);
    const options = {
        tokens: false,
        scopes: true,
        grafts: false,
        requiredScopes: []
    };
    for (const item of docSet.unsuccinctifyPrunedItems(block, options)) {
        const [att, attType, element, key, value] = item[1].split("/");
        if (
            (attType === "spanWithAtts" && element === "w" && key === "strong" && strongs.includes(cleanStrong(value))) ||
            (attType === "milestone" && element === "zaln" && key === "x-strong" && strongs.includes(cleanStrong(value)))
        ) {
            matched.add(value);
            if (!requireAll || matched.size === strongs.length) {
                return true;
            }
        }
    }
    return false;
}

const checkStrongsFormat = (strongs) => {
    for (const strong of strongs) {
        if (!xre.match(strong, xre("^[HG][0-9]+$"))) {
            throw new Error(`Bad Strongs format '${strong} in query'`);
        }
    }
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
                withScriptureCV: {type: GraphQLString},
                withAllStrongs: {type: GraphQLList(GraphQLNonNull(GraphQLString))},
                withAnyStrongs: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
            },
            resolve: (root, args, context) => {
                context.docSet.maybeBuildEnumIndexes();
                if (args.withScopes && args.withScriptureCV) {
                    throw new Error("Cannot specify both withScopes and withScriptureCV");
                }
                if (args.withAllStrongs && args.withAnyStrongs) {
                    throw new Error("Cannot specify both withAllStrongs and withAnyStrongs");
                }
                let ret;
                if (args.withScopes) {
                    ret = root.blocks.filter(b => context.docSet.allScopesInBlock(b, args.withScopes));
                } else if (args.withScriptureCV) {
                    ret = context.docSet.blocksWithScriptureCV(root.blocks, args.withScriptureCV);
                } else {
                    ret = root.blocks;
                }
                if (args.withAllStrongs) {
                    checkStrongsFormat(args.withAllStrongs);
                    ret = ret.filter(b => blockHasStrongs(context.docSet, b, args.withAllStrongs, true));
                }
                if (args.withAnyStrongs) {
                    checkStrongsFormat(args.withAnyStrongs);
                    ret = ret.filter(b => blockHasStrongs(context.docSet, b, args.withAnyStrongs, false));
                }
                return ret;
            }
        }
    })
})

module.exports = sequenceType;
