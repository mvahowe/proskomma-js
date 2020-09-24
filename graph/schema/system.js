const {GraphQLObjectType, GraphQLString} = require('graphql');
const packageJson = require('../../package.json');

class System {

    processor(obj, args, context, info) {
        return "Proskomma"
    };

    processorVersion(obj, args, context, info) {
        return "0.1.0"
    };

    succinctVersion(obj, args, context, info) {
        return "0.1.0"
    };

}

const systemType = new GraphQLObjectType({
    name: "System",
    fields: () => ({
        processor: {type: GraphQLString},
        processorVersion: {type: GraphQLString},
        succinctVersion: {type: GraphQLString}
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
