const {GraphQLObjectType, GraphQLString, GraphQLList} = require('graphql');

const sequenceType = require('./sequence');
const keyValueType = require('./key_value');

const headerById = (root, id) =>
    (id in root.headers) ? root.headers[id] : null;

const documentType = new GraphQLObjectType({
    name: "Document",
    fields: () => ({
        id: {type: GraphQLString},
        docSetId: {type: GraphQLString},
        headers: {
            type: GraphQLList(keyValueType),
            resolve: root => Object.entries(root.headers)
        },
        header: {
            type: GraphQLString,
            args: {
                id: {
                    type: GraphQLString
                }
            },
            resolve: (root, args) => headerById(root, args.id)
        },
        mainSequence: {
            type: sequenceType,
            resolve: (root, args, context, info) => {
                context.docSet = root.processor.docSets[root.docSetId];
                return root.sequences[root.mainId];
            }

        },
        sequences: {
            type: GraphQLList(sequenceType),
            resolve: (root, args, context, info) => {
                context.docSet = root.processor.docSets[root.docSetId];
                return Object.values(root.sequences);
            }
        }
    })
})

module.exports = documentType;
