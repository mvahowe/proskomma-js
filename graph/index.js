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

const runQuery = async (query, context) => {
    if (!context) {context = {}};
    return await graphql(schema, query, null, context);
}

module.exports = {runQuery}