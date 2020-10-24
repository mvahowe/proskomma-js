const {GraphQLObjectType, GraphQLString, GraphQLList, GraphQLNonNull} = require('graphql');

const tokenType = new GraphQLObjectType({
    name: "selectorSPec",
    fields: () => ({
        name: {type: GraphQLNonNull(GraphQLString), resolve: root => root.name},
        type: {type: GraphQLNonNull(GraphQLString), resolve: root => root.type},
        regex: {type: GraphQLString, resolve: root => root.regex || null},
        min: {type: GraphQLString, resolve: root => root.min || null},
        max: {type: GraphQLString, resolve: root => root.max || null},
        enum: {type: GraphQLList(GraphQLNonNull(GraphQLString)), resolve: root => root.enum || null},
    })
})

module.exports = tokenType;
