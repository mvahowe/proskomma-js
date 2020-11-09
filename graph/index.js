const {GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull} = require('graphql');

const docSetType = require('./types/doc_set');
const documentType = require('./types/document');
const keyValueType = require('./types/key_value');
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
                    args: {
                        ids: {
                            type: GraphQLList(GraphQLNonNull(GraphQLString))
                        },
                        selectorKeys: {
                            type: GraphQLList(GraphQLNonNull(GraphQLString))
                        },
                        selectorValues: {
                            type: GraphQLList(GraphQLNonNull(GraphQLString))
                        },
                        withBook: {type: GraphQLString}
                    },
                    resolve: (root, args) => {
                        const docSetMatchesSelectors = (ds, keys, values) => {
                            for (const [n, key] of keys.entries()) {
                                if (ds.selectors[key].toString() !== values[n]) {
                                    return false;
                                }
                            }
                            return true;
                        }
                        const docSetValues = ("withBook" in args ? root.docSetsWithBook(args.withBook) : Object.values(root.docSets))
                            .filter(ds => !args.ids || args.ids.includes(ds.id));
                        if (args.selectorKeys || args.selectorValues) {
                            if (!args.selectorKeys) {
                                throw new Error("selectorValues but no selectorKeys");
                            }
                            if (!args.selectorValues) {
                                throw new Error("selectorKeys but no selectorValues");
                            }
                            if (args.selectorKeys.length !== args.selectorValues.length) {
                                throw new Error("selectorKeys and selectorValues must be the same length");
                            }
                            return docSetValues.filter(ds => docSetMatchesSelectors(ds, args.selectorKeys, args.selectorValues));
                        } else {
                            return docSetValues;
                        }
                    }
                },
                docSet: {
                    type: docSetType,
                    args: {
                        id: {type: GraphQLNonNull(GraphQLString)}
                    },
                    resolve: (root, args) => root.docSetById(args.id)
                },
                nDocuments: {type: GraphQLNonNull(GraphQLInt)},
                documents: {
                    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(documentType))),
                    args: {
                        ids: {type: GraphQLList(GraphQLNonNull(GraphQLString))},
                        withBook: {type: GraphQLString}
                    },
                    resolve: (root, args) => {
                        const documentValues = args.withBook ? root.documentsWithBook(args.withBook) : root.documentList();
                        return documentValues.filter(d => !args.ids || args.ids.includes(d.id));
                    }
                },
                documentById: {
                    type: documentType,
                    args: {
                        id: {type: GraphQLNonNull(GraphQLString)}
                    },
                    resolve: (root, args) => root.documentById(args.id)
                },
            }
        }
    )
});

module.exports = {gqlSchema}