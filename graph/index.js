const {GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const {docSetType} = require('./schema');

const gqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
            name: "Root",
            fields: {
                processor: {type: GraphQLString},
                packageVersion: {type: GraphQLString},
                nDocSets: {type: GraphQLInt},
                docSetList: {type: GraphQLList(docSetType)},
                nDocuments: {type: GraphQLInt}
            }
        }
    )
});

module.exports = {gqlSchema}