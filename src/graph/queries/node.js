const {
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
} = require('graphql');
const { headerBytes } = require('proskomma-utils');
const itemType = require('./item');

const nodeType = new GraphQLObjectType({
  name: 'node',
  description: 'A tree node',
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The node id',
      resolve: (root, args, context) => {
        const [itemLength, itemType, itemSubtype] = headerBytes(root.bs, 0);
        return context.docSet.unsuccinctifyScope(root.bs, itemType, itemSubtype, 0)[2].split('/')[1];
      },
    },
    parentId: {
      type: GraphQLString,
      description: 'The node parent id',
      resolve: (root, args, context) => {
        const parentId = context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeParent'))[0][2].split('/')[1];
        return parentId === 'none' ? null: parentId;
      },
    },
    primaryItems: {
      type: GraphQLList(GraphQLNonNull(itemType)),
      description: 'The primary content of the node as items',
      resolve: (root, args, context) => {
        const primaryScope = context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeContent/-/'))[0];

        if (!primaryScope) {
          return null;
        }

        const [cBlock, cStart, cLength] = primaryScope[2].split('/').slice(2).map(v => parseInt(v));
        const items = context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[cBlock].c, {}, 0);
        return items.slice(cStart, cStart + cLength);
      },
    },
    primaryTokens: {
      type: GraphQLList(GraphQLNonNull(itemType)),
      description: 'The primary content of the node as tokens',
      resolve: (root, args, context) => {
        const primaryScope = context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeContent/-/'))[0];

        if (!primaryScope) {
          return null;
        }

        const [cBlock, cStart, cLength] = primaryScope[2].split('/').slice(2).map(v => parseInt(v));
        const items = context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[cBlock].c, {}, 0);
        return items.slice(cStart, cStart + cLength).filter(i => i[0] === 'token');
      },
    },
    primaryText: {
      type: GraphQLString,
      description: 'The primary content of the node as text',
      resolve: (root, args, context) => {
        const primaryScope = context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeContent/-/'))[0];

        if (!primaryScope) {
          return null;
        }

        const [cBlock, cStart, cLength] = primaryScope[2].split('/').slice(2).map(v => parseInt(v));
        const items = context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[cBlock].c, {}, 0);
        return items.slice(cStart, cStart + cLength).filter(i => i[0] === 'token').map(t => t[2]).join('');
      },
    },
    secondaryKeys: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The keys for secondary content',
      resolve: (root, args, context) => context.docSet.unsuccinctifyScopes(root.is)
        .filter(s => s[2].startsWith('tTreeContent') && !s[2].startsWith('tTreeContent/-/'))
        .map(s => s[2].split('/')[1]),
    },
    secondaryValuesItems: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))))),
      description: 'The values for secondary content as items',
      resolve: (root, args, context) => {
        const valueInts = context.docSet.unsuccinctifyScopes(root.is)
          .filter(s => s[2].startsWith('tTreeContent') && !s[2].startsWith('tTreeContent/-/'))
          .map(s => s[2].split('/').slice(2).map(v => parseInt(v)));
        return valueInts.map(
          vi =>
            context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[vi[0]].c, {}, 0)
              .slice(vi[1], vi[1] + vi[2]),
        );
      },
    },
    secondaryValuesTokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))))),
      description: 'The values for secondary content as tokens',
      resolve: (root, args, context) => {
        const valueInts = context.docSet.unsuccinctifyScopes(root.is)
          .filter(s => s[2].startsWith('tTreeContent') && !s[2].startsWith('tTreeContent/-/'))
          .map(s => s[2].split('/').slice(2).map(v => parseInt(v)));
        return valueInts.map(
          vi =>
            context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[vi[0]].c, {}, 0)
              .slice(vi[1], vi[1] + vi[2])
              .filter(i => i[0] === 'token'),
        );
      },
    },
    secondaryValuesText: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The values for secondary content as text',
      resolve: (root, args, context) => {
        const valueInts = context.docSet.unsuccinctifyScopes(root.is)
          .filter(s => s[2].startsWith('tTreeContent') && !s[2].startsWith('tTreeContent/-/'))
          .map(s => s[2].split('/').slice(2).map(v => parseInt(v)));
        return valueInts.map(
          vi =>
            context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[vi[0]].c, {}, 0)
              .slice(vi[1], vi[1] + vi[2])
              .filter(i => i[0] === 'token')
              .map(t => t[2])
              .join(''),
        );
      },
    },
    secondaryValueItems: {
      type: GraphQLList(GraphQLNonNull(itemType)),
      description: 'The value for the specified secondary content key, as items',
      args: {
        key: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The secondary content key',
        },
      },
      resolve: (root, args, context) => {
        const valueInt = context.docSet.unsuccinctifyScopes(root.is)
          .filter(s => s[2].startsWith(`tTreeContent/${args.key}/`))
          .map(s => s[2].split('/').slice(2).map(v => parseInt(v)));

        if (valueInt.length === 0) {
          return null;
        }

        const vi = valueInt[0];
        return context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[vi[0]].c, {}, 0)
          .slice(vi[1], vi[1] + vi[2]);
      },
    },
    secondaryValueTokens: {
      type: GraphQLList(GraphQLNonNull(itemType)),
      description: 'The value for the specified secondary content key, as tokens',
      args: {
        key: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The secondary content key',
        },
      },
      resolve: (root, args, context) => {
        const valueInt = context.docSet.unsuccinctifyScopes(root.is)
          .filter(s => s[2].startsWith(`tTreeContent/${args.key}/`))
          .map(s => s[2].split('/').slice(2).map(v => parseInt(v)));

        if (valueInt.length === 0) {
          return null;
        }

        const vi = valueInt[0];
        return context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[vi[0]].c, {}, 0)
          .slice(vi[1], vi[1] + vi[2])
          .filter(i => i[0] === 'token');
      },
    },
    secondaryValueText: {
      type: GraphQLString,
      description: 'The value for the specified secondary content key, as text',
      args: {
        key: {
          type: GraphQLNonNull(GraphQLString),
          description: 'The secondary content key',
        },
      },
      resolve: (root, args, context) => {
        const valueInt = context.docSet.unsuccinctifyScopes(root.is)
          .filter(s => s[2].startsWith(`tTreeContent/${args.key}/`))
          .map(s => s[2].split('/').slice(2).map(v => parseInt(v)));

        if (valueInt.length === 0) {
          return null;
        }

        const vi = valueInt[0];
        return context.docSet.unsuccinctifyItems(context.treeContentSequence.blocks[vi[0]].c, {}, 0)
          .slice(vi[1], vi[1] + vi[2])
          .filter(i => i[0] === 'token')
          .map(t => t[2])
          .join('');
      },
    },
    childIds: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: 'The node children ids',
      resolve: (root, args, context) => {
        return context.docSet.unsuccinctifyScopes(root.is).filter(s => s[2].startsWith('tTreeChild'))
          .map(s => s[2].split('/')[2]);
      },
    },
  }),
});

module.exports = nodeType;
