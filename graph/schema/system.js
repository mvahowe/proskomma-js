const {GraphQLObjectType, GraphQLString, GraphQLInt} = require('graphql');
const packageJson = require('../../package.json');

class System {

    processor() {
        return "Proskomma"
    };

    packageVersion() {
        return packageJson.version;
    };

    nDocSets(obj, args) {
        return Object.keys(args.proskomma.docSets).length;
    }

    nDocuments(obj, args) {
        return Object.keys(args.proskomma.documents).length;
    }

}

const systemType = new GraphQLObjectType({
    name: "System",
    fields: () => ({
        processor: {type: GraphQLString},
        packageVersion: {type: GraphQLString},
        nDocSets: {type: GraphQLInt},
        nDocuments: {type: GraphQLInt}
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
