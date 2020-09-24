const {graphql, GraphQLSchema, GraphQLObjectType} = require('graphql');

const { systemQuery } = require('./schema/');

const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
                name: "Root",
                fields: {
                    system: systemQuery
                }
            }
        )
    }
)

const runQuery = async (query) => {
    return await graphql(schema, query);
}

module.exports = {runQuery}