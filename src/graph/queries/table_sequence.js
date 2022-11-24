import xre from 'xregexp';
import utils from "../../util";

const tableSequenceSchemaString = `
"""A contiguous flow of content for a table"""
type tableSequence {
  """The id of the sequence"""
  id: String!
  """The number of cells in the table sequence"""
  nCells: Int!
  """The number of rows in the table sequence"""
  nRows: Int!
  """The number of columns in the table sequence"""
  nColumns: Int!
  """The cells in the table sequence"""
  cells: [cell!]!
  """The rows in the table sequence"""
  rows(
    """Only return rows whose zero-indexed position is in the list"""
    positions: [Int!]
    """Only return columns whose zero-indexed position is in the list"""
    columns: [Int!]
    """Only return rows whose cells match the specification"""
    matches: [rowMatchSpec!]
    """'Only return rows whose cells contain one of the values in the specification"""
    equals: [rowEqualsSpec!]
  ): [[cell!]!]!
  """A list of the tags of this sequence"""
  tags: [String!]!
  """A list of the tags of this sequence as key/value tuples"""
  tagsKv: [KeyValue!]!
  """Whether or not the sequence has the specified tag"""
  hasTag(
    """The tag name"""
    tagName: String
  ): Boolean!
  """A list of column headings for this tableSequence, derived from the sequence tags"""
  headings: [String!]!
}
`;

const tableSequenceResolvers = {
  nCells: root => root.blocks.length,
  nRows: (root, args, context) => {
    const rowNs = new Set([]);

    for (const block of root.blocks) {
      const [itemLength, itemType, itemSubtype] = utils.succinct.headerBytes(block.bs, 0);
      const bsPayload = context.docSet.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0)[2];
      rowNs.add(bsPayload.split('/')[1]);
    }
    return rowNs.size;
  },
  nColumns: (root, args, context) => {
    const columnNs = new Set([]);

    for (const block of root.blocks) {
      for (const scope of context.docSet.unsuccinctifyScopes(block.is).map(s => s[2])) {
        if (scope.startsWith('tTableCol')) {
          columnNs.add(scope.split('/')[1]);
        }
      }
    }
    return columnNs.size;
  },
  cells: (root, args, context) => {
    const ret = [];

    for (const block of root.blocks) {
      ret.push([
        context.docSet.unsuccinctifyScopes(block.bs)
          .map(s => parseInt(s[2].split('/')[1])),
        Array.from(new Set(
          context.docSet.unsuccinctifyScopes(block.is)
            .filter(s => s[2].startsWith('tTableCol'))
            .map(s => parseInt(s[2].split('/')[1])),
        )),
        context.docSet.unsuccinctifyItems(block.c, {}, 0),
      ]);
    }
    return ret;
  },
  rows: (root, args, context) => {
    const rowMatches1 = (row, matchSpec) => {
      if (row[matchSpec.colN] === undefined) {
        return false;
      }
      const matchCellText = row[matchSpec.colN][2]
        .filter(i => i[0] === 'token')
        .map(i => i[2])
        .join('');
      return xre.test(matchCellText, xre(matchSpec.matching));
    };

    const rowMatches = (row, matchSpecs) => {
      if (matchSpecs.length === 0) {
        return true;
      }

      if (rowMatches1(row, matchSpecs[0])) {
        return rowMatches(row, matchSpecs.slice(1));
      }
      return false;
    };

    const rowEquals1 = (row, matchSpec) => {
      if (row[matchSpec.colN] === undefined) {
        return false;
      }
      const matchCellText = row[matchSpec.colN][2]
        .filter(i => i[0] === 'token')
        .map(i => i[2])
        .join('');
      return matchSpec.values.includes(matchCellText);
    };

    const rowEquals = (row, matchSpecs) => {
      if (matchSpecs.length === 0) {
        return true;
      }

      if (rowEquals1(row, matchSpecs[0])) {
        return rowEquals(row, matchSpecs.slice(1));
      }
      return false;
    };

    let ret = [];
    let row = -1;

    for (const block of root.blocks) {
      const rows = context.docSet.unsuccinctifyScopes(block.bs)
        .map(s => parseInt(s[2].split('/')[1]));
      if (args.positions && !args.positions.includes(rows[0])) {
        continue;
      }

      if (rows[0] !== row) {
        ret.push([]);
        row = rows[0];
      }
      ret[ret.length - 1].push([
        rows,
        Array.from(new Set(
          context.docSet.unsuccinctifyScopes(block.is)
            .filter(s => s[2].startsWith('tTableCol'))
            .map(s => parseInt(s[2].split('/')[1])),
        )),
        context.docSet.unsuccinctifyItems(block.c, {}, 0),
      ]);
    }

    if (args.matches) {
      ret = ret.filter(row => rowMatches(row, args.matches));
    }

    if (args.equals) {
      ret = ret.filter(row => rowEquals(row, args.equals));
    }

    if (args.columns) {
      ret = ret.map(
        row =>
          [...row.entries()]
            .filter(re => args.columns.includes(re[0]))
            .map(re => re[1]));
    }
    return ret;
  },
  tags: root => Array.from(root.tags),
  tagsKv: root => Array.from(root.tags).map(t => {
    if (t.includes(':')) {
      return [t.substring(0, t.indexOf(':')), t.substring(t.indexOf(':') + 1)];
    } else {
      return [t, ''];
    }
  }),
  hasTag: (root, args) => root.tags.has(args.tagName),
  headings: root => Array.from(root.tags)
    .filter(t => t.startsWith('col'))
    .sort((a, b) => parseInt(a.split(':')[0].substring(3)) - parseInt(b.split(':')[0].substring(3)))
    .map(t => t.split(':')[1]),
};

export {
  tableSequenceSchemaString,
  tableSequenceResolvers,
};
