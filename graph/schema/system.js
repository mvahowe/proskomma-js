const {GraphQLObjectType, GraphQLString, GraphQLInt} = require('graphql');
const packageJson = require('../../package.json');

class System {

    processor(obj, args, context, info) {
        return "Proskomma"
    };

    packageVersion(obj, args, context, info) {
        return packageJson.version;
    };

    nDocSets(obj, args, context, info) {
        return Object.keys(args.proskomma.docSets).length;
    }

}

const systemType = new GraphQLObjectType({
    name: "System",
    fields: () => ({
        processor: {type: GraphQLString},
        packageVersion: {type: GraphQLString},
        nDocSets: {type: GraphQLInt}
    }),
    resolve: () => new System()
})

module.exports = (
    {
        type: systemType,
        resolve() {
            return new System();
        }
    }
);
