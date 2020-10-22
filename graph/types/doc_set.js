const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull} = require('graphql');
const documentType = require('./document');

const docSetType = new GraphQLObjectType({
    name: "DocSet",
    fields: {
        id: {type: GraphQLNonNull(GraphQLString)},
        lang: {type: GraphQLString},
        abbr: {type: GraphQLString},
        documents: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(documentType))),
            resolve: (root, args, context, info) => {
                context.docSet = root;
                return root.documents();
            }
        },
        documentWithBook: {
            type: documentType,
            args: {
                bookCode: {type: GraphQLNonNull(GraphQLString)}
            },
            resolve: (root, args) => root.documentWithBook(args.bookCode)
        }
    },
})

module.exports = docSetType;

