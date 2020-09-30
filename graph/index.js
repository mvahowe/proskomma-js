const {GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const {docSetType, documentType} = require('./types');

const gqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
            name: "Root",
            fields: {
                processor: {type: GraphQLString},
                packageVersion: {type: GraphQLString},
                nDocSets: {type: GraphQLInt},
                docSetList: {type: GraphQLList(docSetType)},
                docSetById: {
                  type: docSetType,
                  args: {
                      id: {type: GraphQLString}
                  }
                },
                nDocuments: {type: GraphQLInt},
                documents: {
                    type: GraphQLList(documentType),
                    resolve: root => root.documentList()
                },
                documentById: {
                    type: documentType,
                    args: {
                        id: {type: GraphQLString}
                    }
                }
            }
        }
    )
});

module.exports = {gqlSchema}