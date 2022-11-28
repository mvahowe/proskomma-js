import { PerfRenderFromJson } from 'proskomma-json-tools';

const oneifyTag = t => {
  if (['toc', 'toca', 'mt', 'imt', 's', 'ms', 'mte', 'sd'].includes(t)) {
    return t + '1';
  }
  return t;
};

const buildMilestone = (atts, type) => {
  let str=`\\${type}-s |`;

  for (let [key, value] of Object.entries(atts)) {
    if (key === 'x-morph') {
      str = str + oneifyTag(key) + '="' + value.join(',') + '" ';
    } else {
      str = str + oneifyTag(key) + '="' + value + '" ';
    }
  };
  return str + '\\*';
};

const buildEndWrapper = (atts, type, isnested = false) => {
  let str='|';

  for (let [key, value] of Object.entries(atts)) {
    str = str + oneifyTag(key) + '="' + value + '" ';
  };
  str = str + '\\';

  // if it's nested, we simply add a "+" sign before the type
  if (isnested) {
    str = str + '+';
  }
  return str + type + '*';
};

const localToUsfmActions = {
  startDocument: [
    {
      description: 'Set up environment',
      test: () => true,
      action: ({ context, workspace }) => {
        workspace.usfmBits = [''];
        workspace.nestedWrapper = 0;

        for (
          let [key, value] of
          Object.entries(context.document.metadata.document)
            .filter(kv => !['tags', 'properties', 'bookCode', 'cl'].includes(kv[0]))
        ) {
          workspace.usfmBits.push(`\\${oneifyTag(key)} ${value}\n`);
        };
      },
    },
  ],
  blockGraft: [
    {
      description: 'Follow block grafts',
      test: ({ context }) => ['title', 'heading', 'introduction'].includes(context.sequences[0].block.subType),
      action: (environment) => {
        let contextSequence = environment.context.sequences[0];
        let chapterValue = environment.config.report[contextSequence.block.blockN.toString()];
        const target = contextSequence.block.target;

        if (chapterValue && contextSequence.type === 'main') {
          environment.workspace.usfmBits.push(`\n\\c ${chapterValue}\n`);
        }

        if (target) {
          environment.context.renderer.renderSequenceId(environment, target);
        }
      },
    },
  ],
  inlineGraft: [
    {
      description: 'Follow inline grafts',
      test: () => true,
      action: (environment) => {
        const target = environment.context.sequences[0].element.target;

        if (target) {
          environment.context.renderer.renderSequenceId(environment, target);
        }
      },
    },
  ],
  startParagraph: [
    {
      description: 'Output footnote paragraph tag (footnote)',
      test: ({ context }) => (context.sequences[0].block.subType === 'usfm:f' && context.sequences[0].type === 'footnote')
            || (context.sequences[0].block.subType === 'usfm:x' && context.sequences[0].type === 'xref'),
      action: ({ context, workspace }) => {
        workspace.nestedWrapper = 0;
        let contextSequence = context.sequences[0];
        workspace.usfmBits.push(`\\${oneifyTag(contextSequence.block.subType.split(':')[1])} `);
      },
    },
    {
      description: 'Output footnote note_caller tag (footnote)',
      test: ({ context }) => context.sequences[0].block.subType === 'usfm:f' || context.sequences[0].block.subType === 'usfm:x',
      action: ({ workspace }) => {
        workspace.nestedWrapper = 0;
      },
    },
    {
      description: 'Output paragraph tag (main)',
      test: () => true,
      action: ({
        context, workspace, config,
      }) => {
        workspace.nestedWrapper = 0;
        let contextSequence = context.sequences[0];
        let chapterValue = config.report[contextSequence.block.blockN.toString()];

        if (chapterValue && contextSequence.type === 'main') {
          workspace.usfmBits.push(`\n\\c ${chapterValue}\n`);
        }
        workspace.usfmBits.push(`\n\\${oneifyTag(contextSequence.block.subType.split(':')[1])}\n`);
      },
    },
  ],
  endParagraph: [
    {
      description: 'Output footnote paragraph tag (footnote)',
      test: ({ context }) => (context.sequences[0].block.subType === 'usfm:f' && context.sequences[0].type === 'footnote')
            || (context.sequences[0].block.subType === 'usfm:x' && context.sequences[0].type === 'xref'),
      action: ({ context, workspace }) => {
        let contextSequence = context.sequences[0];
        workspace.usfmBits.push(`\\${oneifyTag(contextSequence.block.subType.split(':')[1])}*`);
      },
    },
    {
      description: 'Output footnote note_caller tag (footnote)',
      test: ({ context }) => context.sequences[0].block.subType === 'usfm:f' || context.sequences[0].block.subType === 'usfm:x',
      action: () => {
      },
    },
    {
      description: 'Output nl',
      test: () => true,
      action: ({ workspace }) => {
        workspace.usfmBits.push(`\n`);
      },
    },
  ],
  startMilestone: [
    {
      description: 'Output start milestone',
      test: () => true,
      action: ({ context, workspace }) => {
        let contextSequenceElement = context.sequences[0].element;
        let newStartMileStone = buildMilestone(contextSequenceElement.atts, oneifyTag(contextSequenceElement.subType.split(':')[1]));
        workspace.usfmBits.push(newStartMileStone);
      },
    },
  ],
  endMilestone: [
    {
      description: 'Output end milestone',
      test: () => true,
      action: ({ context, workspace }) => {
        workspace.usfmBits.push(`\\${oneifyTag(context.sequences[0].element.subType.split(':')[1])}-e\\*`);
      },
    },
  ],
  text: [
    {
      description: 'Output text',
      test: () => true,
      action: ({ context, workspace }) => {
        const text = context.sequences[0].element.text;
        workspace.usfmBits.push(text);
      },
    },
  ],
  mark: [
    {
      description: 'Output chapter or verses',
      test: () => true,
      action: ({ context, workspace }) => {
        const element = context.sequences[0].element;

        if (element.subType === 'verses') {
          workspace.usfmBits.push(`\n\\v ${element.atts['number']}\n`);
        }
      },
    },
  ],
  endSequence: [
    {
      description: 'Output \\cl',
      test: ({ context }) => context.document.metadata.document.cl && context.sequences[0].type === 'title',
      action: ({ context, workspace }) => {
        workspace.usfmBits.push(`\n\\cl ${context.document.metadata.document.cl}\n`);
      },
    },
  ],
  startWrapper: [
    {
      description: 'Output start tag',
      test: () => true,
      action: ({ workspace, context }) => {
        let contextSequence = context.sequences[0];

        // handle nested wrappers : https://ubsicap.github.io/usfm/characters/nesting.html
        if (workspace.nestedWrapper > 0) {
          workspace.usfmBits.push(`\\+${oneifyTag(contextSequence.element.subType.split(':')[1])} `);
        } else {
          workspace.usfmBits.push(`\\${oneifyTag(contextSequence.element.subType.split(':')[1])} `);
        }
        workspace.nestedWrapper += 1;
      },
    },
  ],
  endWrapper: [
    {
      description: 'Output end tag',
      test: ({ context }) => !['fr', 'fq','fqa','fk','fl','fw','fp', 'ft', 'xo', 'xk', 'xq', 'xt', 'xta']
        .includes(context.sequences[0].element.subType.split(':')[1]),
      action: ({ workspace, context }) => {
        workspace.nestedWrapper -= 1;
        let contextSequence = context.sequences[0];
        let subType = contextSequence.element.subType.split(':')[1];
        let isNested = workspace.nestedWrapper > 0;

        if (subType === 'w') {
          let newEndW = buildEndWrapper(contextSequence.element.atts, oneifyTag(subType), isNested);
          workspace.usfmBits.push(newEndW);
        } else {
          // handle nested wrappers : https://ubsicap.github.io/usfm/characters/nesting.html
          if (isNested) {
            workspace.usfmBits.push(`\\+${oneifyTag(contextSequence.element.subType.split(':')[1])}*`);
          } else {
            workspace.usfmBits.push(`\\${oneifyTag(contextSequence.element.subType.split(':')[1])}*`);
          }
        }
      },
    },
    {
      description: 'Do NOT output end tag',
      test: () => true,
      action: ({ workspace }) => {
        workspace.nestedWrapper -= 1;
      },
    },
  ],
  endDocument: [
    {
      description: 'Build output',
      test: () => true,
      action: ({ workspace, output }) => {
        output.usfm = workspace.usfmBits.join('').replace(/(\s*)\n(\s*)/gm, '\n');
      },
    },
  ],
};

const perf2usfmCode = function ({ perf, report }) {
  const cl = new PerfRenderFromJson({ srcJson: perf, actions: localToUsfmActions });
  const output = {};

  cl.renderDocument({
    docId: '', config: { report }, output,
  });
  return { usfm: output.usfm };
};

const perf2usfm = {
  name: 'perf2usfm',
  type: 'Transform',
  description: 'PERF=>USFM',
  inputs: [
    {
      name: 'perf',
      type: 'json',
      source: '',
    },
    {
      name: 'report',
      type: 'json',
      source: '',
    },
  ],
  outputs: [
    {
      name: 'usfm',
      type: 'text',
    },
  ],
  code: perf2usfmCode,
};
export default perf2usfm;
