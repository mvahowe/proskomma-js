const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');
const packageJson = require('../../package.json');

const docSetType = new GraphQLObjectType({
    name: "DocSet",
    fields: () => ({
        id: {type: GraphQLString}
    })
})

const docSetResolve = (pk) => new DocSet(pk);

class PK {

    constructor(pk) {
        this.proskomma = pk;
    }

    packageVersion() {
        return packageJson.version;
    };

    nDocSets() {
        return Object.keys(this.proskomma.docSets).length;
    }

    nDocuments() {
        return Object.keys(this.proskomma.documents).length;
    }

    docSets() {
        return Object.values(this.proskomma.docSets);
    }

    documents() {
        return this.proskomma.documents;
    }

}

const pkType = new GraphQLObjectType({
    name: "PK",
    fields: () => ({
        processor: {type: GraphQLString},
        packageVersion: {type: GraphQLString},
        nDocSets: {type: GraphQLInt},
        nDocuments: {type: GraphQLInt},
        docSetList: {type: GraphQLList(docSetType)}
    })
})

const pkResolve = (pk) => new PK(pk)

module.exports = { pkType, pkResolve, docSetType }

