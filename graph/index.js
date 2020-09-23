const {
    graphql,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
} = require('graphql');
const packageJson = require('../package.json');

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
            processor: {
                type: GraphQLString,
                resolve() {
                    return "Proskomma";
                },
            },
            version: {
                type: GraphQLString,
                resolve() {
                    return packageJson.version;
                }
            }
        },
    }),
});

const runQuery = async (query) => {
    let ret = await graphql(schema, query);
    return Promise.resolve(ret);
}

module.exports = { runQuery }