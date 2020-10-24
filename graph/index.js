const {GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull} = require('graphql');

const docSetType = require('./types/doc_set');
const documentType = require('./types/document');
const selectorSpecType = require('./types/selector_spec');

const gqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
            name: "Root",
            fields: {
                processor: {type: GraphQLNonNull(GraphQLString)},
                packageVersion: {type: GraphQLNonNull(GraphQLString)},
                selectors: {
                    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(selectorSpecType))),
                    resolve: root => root.selectors
                },
                nDocSets: {type: GraphQLNonNull(GraphQLInt)},
                docSets: {
                    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(docSetType))),
                    resolve: root => Object.values(root.docSets)
                },
                docSetById: {
                    type: docSetType,
                    args: {
                        id: {type: GraphQLNonNull(GraphQLString)}
                    },
                    resolve: (root, args) => root.docSetById(args.id)
                },
                docSetsById: {
                    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(docSetType))),
                    args: {
                        ids: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))}
                    },
                    resolve: (root, args) => root.docSetsById(args.ids)
                },
                docSetsWithBook: {
                    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(docSetType))),
                    args: {
                        bookCode: {type: GraphQLNonNull(GraphQLString)}
                    },
                    resolve: (root, args) => root.docSetsWithBook(args.bookCode)
                },
                nDocuments: {type: GraphQLNonNull(GraphQLInt)},
                documents: {
                    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(documentType))),
                    resolve: root => root.documentList()
                },
                documentById: {
                    type: documentType,
                    args: {
                        id: {type: GraphQLNonNull(GraphQLString)}
                    },
                    resolve: (root, args) => root.documentById(args.id)
                },
                documentsById: {
                    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(documentType))),
                    args: {
                        ids: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))}
                    },
                    resolve: (root, args) => root.documentsById(args.ids)
                },
                documentsWithBook: {
                    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(documentType))),
                    args: {
                        bookCode: {type: GraphQLNonNull(GraphQLString)}
                    },
                    resolve: (root, args) => root.documentsWithBook(args.bookCode)
                }
            }
        }
    )
});

module.exports = {gqlSchema}