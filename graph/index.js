const {GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const docSetType = require('./types/doc_set');
const documentType = require('./types/document');

const gqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
            name: "Root",
            fields: {
                processor: {type: GraphQLString},
                packageVersion: {type: GraphQLString},
                nDocSets: {type: GraphQLInt},
                docSets: {
                    type: GraphQLList(docSetType),
                    resolve: root => Object.values(root.docSets)
                },
                docSetById: {
                    type: docSetType,
                    args: {
                        id: {type: GraphQLString}
                    },
                    resolve: (root, args) => root.docSetById(args.id)
                },
                docSetsById: {
                    type: GraphQLList(docSetType),
                    args: {
                        ids: {type: GraphQLList(GraphQLString)}
                    },
                    resolve: (root, args) => root.docSetsById(args.ids)
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
                    },
                    resolve: (root, args) => root.documentById(args.id)
                },
                documentsById: {
                    type: GraphQLList(documentType),
                    args: {
                        ids: {type: GraphQLList(GraphQLString)}
                    },
                    resolve: (root, args) => root.documentsById(args.ids)
                }
            }
        }
    )
});

module.exports = {gqlSchema}