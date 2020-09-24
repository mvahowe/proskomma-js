const {GraphQLObjectType, GraphQLString} = require('graphql');
const packageJson = require('../../package.json');

class System {

    processor(obj, args, context, info) {
        return "Proskomma"
    };

    packageVersion(obj, args, context, info) {
        return packageJson.version;
    };

}

const systemType = new GraphQLObjectType({
    name: "System",
    fields: () => ({
        processor: {type: GraphQLString},
        packageVersion: {type: GraphQLString}
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
