const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} = require('graphql');
const { headerBytes } = require('proskomma-utils');
const itemType = require('./item');

const dumpItem = i => {
  switch (i[0]) {
  case 'token':
    return `|${i[2]}`;
  case 'scope':
    const wrapper = i[1] === 'start' ? '+' : '-';
    return `${wrapper}${i[2]}${wrapper}`;
  case 'graft':
    return `>${i[1]}<`;
  }
};

const dumpBlock = b => {
  const ret = ['Block:'];

  if (b.bg.length > 0) {
    b.bg.forEach(bbg => ret.push(`   ${bbg[1]} graft to ${bbg[2]}`));
  }
  ret.push(`   Scope ${b.bs[2]}`);
  ret.push(`   ${b.c.map(bci => dumpItem(bci)).join('')}`);
  return ret.join('\n');
};

const blockType = new GraphQLObjectType({
  name: 'Block',
  fields: () => ({
    cBL: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.c.length,
    },
    bgBL: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.bg.length,
    },
    osBL: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.os.length,
    },
    isBL: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: root => root.is.length,
    },
    cL: {
      type: GraphQLNonNull(GraphQLInt),
      resolve:
        (root, args, context) => context.docSet.countItems(root.c),
    },
    bgL: {
      type: GraphQLNonNull(GraphQLInt),
      resolve:
        (root, args, context) => context.docSet.countItems(root.bg),
    },
    osL: {
      type: GraphQLNonNull(GraphQLInt),
      resolve:
        (root, args, context) => context.docSet.countItems(root.os),
    },
    isL: {
      type: GraphQLNonNull(GraphQLInt),
      resolve:
        (root, args, context) => context.docSet.countItems(root.is),
    },
    is: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      resolve:
        (root, args, context) => context.docSet.unsuccinctifyScopes(root.is),
    },
    os: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      resolve:
        (root, args, context) => context.docSet.unsuccinctifyScopes(root.os),
    },
    bs: {
      type: GraphQLNonNull(itemType),
      resolve:
        (root, args, context) => {
          const [itemLength, itemType, itemSubtype] = headerBytes(root.bs, 0);
          return context.docSet.unsuccinctifyScope(root.bs, itemType, itemSubtype, 0);
        },
    },
    bg: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      resolve:
        (root, args, context) => context.docSet.unsuccinctifyGrafts(root.bg),
    },
    items: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      args: {
        withScopes: { type: GraphQLList(GraphQLString) },
        anyScope: { type: GraphQLBoolean },
        withScriptureCV: { type: GraphQLString },
        includeContext: { type: GraphQLBoolean },
      },
      resolve:
        (root, args, context) => {
          if (args.withScopes && args.withScriptureCV) {
            throw new Error('Cannot specify both withScopes and withScriptureCV');
          }

          if (args.withScriptureCV) {
            return context.docSet.unsuccinctifyItemsWithScriptureCV(root, args.withScriptureCV, {}, args.includeContext || false);
          } else {
            return context.docSet.unsuccinctifyPrunedItems(
              root,
              {
                tokens: true,
                scopes: true,
                grafts: true,
                requiredScopes: args.withScopes || [],
                anyScope: args.anyScope || false,
              },
              args.includeContext || false,
            );
          }
        },
    },
    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(itemType))),
      args: {
        withScopes: { type: GraphQLList(GraphQLString) },
        anyScope: { type: GraphQLBoolean },
        withScriptureCV: { type: GraphQLString },
        includeContext: { type: GraphQLBoolean },
        withChars: { type: GraphQLList(GraphQLNonNull(GraphQLString)) },
      },
      resolve:
        (root, args, context) => {
          let ret;

          if (args.withScriptureCV) {
            ret = context.docSet.unsuccinctifyItemsWithScriptureCV(
              root,
              args.withScriptureCV,
              { tokens: true },
              args.includeContext || false,
            );
          } else {
            ret = context.docSet.unsuccinctifyPrunedItems(
              root,
              {
                tokens: true,
                scopes: true,
                requiredScopes: args.withScopes || [],
                anyScope: args.anyScope || false,
              },
              args.includeContext || false,
            );
          }

          if (args.withChars) {
            ret = ret.filter(i => args.withChars.includes(i[2]));
          }

          return ret.filter(i => i[0] === 'token');
        },
    },
    text: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        withScriptureCV: { type: GraphQLString },
        normalizeSpace: { type: GraphQLBoolean },
      },
      resolve:
        (root, args, context) => {
          const tokens = args.withScriptureCV ?
            context.docSet.unsuccinctifyItemsWithScriptureCV(
              root,
              args.withScriptureCV,
              { tokens: true },
              false,
            ) :
            context.docSet.unsuccinctifyItems(root.c, { tokens: true }, false);
          let ret = tokens.map(t => t[2]).join('').trim();

          if (args.normalizeSpace) {
            ret = ret.replace(/[ \t\n\r]+/g, ' ');
          }
          return ret;
        },
    },
    dump: {
      type: GraphQLNonNull(GraphQLString),
      resolve:
        (root, args, context) => dumpBlock(context.docSet.unsuccinctifyBlock(root, {}, false)),
    },
    scopeLabels: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      resolve:
        (root, args, context) =>
          [...context.docSet.unsuccinctifyBlockScopeLabelsSet(root)],
    },
  }),
});

module.exports = blockType;
