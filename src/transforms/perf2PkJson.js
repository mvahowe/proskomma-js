import { PerfRenderFromJson } from 'proskomma-json-tools';
import xre from 'xregexp';
import { lexingRegexes } from '../parser/lexers/lexingRegexes';

const wordLikeRegex = lexingRegexes.filter(r => r[1] === 'wordLike')[0][2];
const lineSpaceRegex = lexingRegexes.filter(r => r[1] === 'lineSpace')[0][2];
const punctuationRegex = lexingRegexes.filter(r => r[1] === 'punctuation')[0][2];

const closeAllOpenScopes = workspace => {
  [...workspace.os]
    .reverse()
    .forEach(o => {
      workspace.block.items.push({
        type: 'scope',
        subType: 'end',
        payload: o,
      },
      );
    },
    );
  workspace.os = [];
};

const closeParagraphScopes = workspace => {
  [...workspace.os.filter(o => ['span'].includes(o.split('/')[1]))]
    .reverse()
    .forEach(o => {
      workspace.block.items.push({
        type: 'scope',
        subType: 'end',
        payload: o,
      });
      workspace.os = [...workspace.os.filter(wo => wo !== o)];
    },
    );
};

const closeVerseScopes = workspace => {
  [...workspace.os.filter(o => ['verse', 'verses'].includes(o.split('/')[0]))]
    .reverse()
    .forEach(o => {
      workspace.block.items.push({
        type: 'scope',
        subType: 'end',
        payload: o,
      });
      workspace.os = [...workspace.os.filter(wo => wo !== o)];
    },
    );
};

const closeChapterScopes = workspace => {
  [...workspace.os.filter(o => ['chapter'].includes(o.split('/')[0]))]
    .reverse()
    .forEach(o => {
      workspace.block.items.push({
        type: 'scope',
        subType: 'end',
        payload: o,
      });
      workspace.os = [...workspace.os.filter(wo => wo !== o)];
    },
    );
};

const perf2PkJsonActions = {

  startDocument: [
    {
      description: 'Set up word object',
      test: () => true,
      action: ({
        workspace,
        output,
      }) => {
        output.pkJson = {};
        workspace.sequenceId = null;
        workspace.block = null;
        workspace.os = [];
        workspace.waitingBlockGrafts = [];
      },
    },
  ],

  startSequence: [
    {
      description: 'Add sequence array to output',
      test: () => true,
      action: (environment) => {
        environment.output.pkJson[environment.context.sequences[0].id] = [];
        environment.workspace.sequenceId = environment.context.sequences[0].id;
      },
    },
  ],

  endSequence: [
    {
      description: 'Reset sequenceId pointer',
      test: () => true,
      action: (environment) => {
        closeAllOpenScopes(environment.workspace);
        environment.workspace.sequenceId = environment.context.sequences[1]?.id;
      },
    },
  ],

  unresolvedBlockGraft: [
    {
      description: 'Stash for next para',
      test: () => true,
      action: ({
        context,
        workspace,
      }) => {
        const target = context.sequences[0].block.target;

        if (target) {
          workspace.waitingBlockGrafts.push({
            type: 'graft',
            subType: context.sequences[0].block.subType,
            payload: context.sequences[0].block.target,
          });
        }
      },
    },
  ],

  unresolvedInlineGraft: [
    {
      description: 'Follow inline grafts',
      test: () => true,
      action: ({
        context,
        workspace,
      }) => {
        const target = context.sequences[0].element.target;

        if (target) {
          workspace.block.items.push({
            type: 'graft',
            subType: context.sequences[0].element.subType,
            payload: context.sequences[0].element.target,
          });
        }
      },
    },
  ],

  startParagraph: [
    {
      description: 'Add object for paragraph block',
      test: () => true,
      action: ({
        context,
        workspace,
        output,
      }) => {
        workspace.block = {
          os: [...workspace.os],
          is: [],
          bs: {
            type: 'scope',
            subType: 'start',
            payload: `blockTag/${context.sequences[0].block.subType.split(':')[1]}`,
          },
          bg: [...workspace.waitingBlockGrafts],
          items: [],
        };
        output.pkJson[workspace.sequenceId].push(workspace.block);
      },
    },
  ],
  endParagraph: [
    {
      description: 'Close open scopes',
      test: () => true,
      action: ({ workspace }) => {
        closeParagraphScopes(workspace);
        workspace.waitingBlockGrafts = [];
      },
    },
  ],
  mark: [
    {
      description: 'ts mark as milestone',
      test: ({ context }) => ['usfm:ts'].includes(context.sequences[0].element.subType),
      action: ({ workspace }) => {
        const milestoneScope = `milestone/ts`;

        if (!workspace.block.is.includes(milestoneScope)) {
          workspace.block.is.push(milestoneScope);
        }
        workspace.os.push(milestoneScope);
        workspace.block.items.push({
          type: 'scope',
          subType: 'start',
          payload: milestoneScope,
        });
        workspace.block.items.push({
          type: 'scope',
          subType: 'end',
          payload: milestoneScope,
        });
      },
    },
    {
      description: 'Chapter',
      test: ({ context }) => ['chapter'].includes(context.sequences[0].element.subType),
      action: ({
        context,
        workspace,
      }) => {
        closeVerseScopes(workspace);
        closeChapterScopes(workspace);
        const element = context.sequences[0].element;
        const chapterScope = `chapter/${element.atts['number']}`;

        if (!workspace.block.is.includes(chapterScope)) {
          workspace.block.is.push(chapterScope);
        }
        workspace.os.push(chapterScope);
        workspace.block.items.push({
          type: 'scope',
          subType: 'start',
          payload: chapterScope,
        });
      },
    },
    {
      description: 'Verses',
      test: ({ context }) => ['verses'].includes(context.sequences[0].element.subType),
      action: ({
        context,
        workspace,
      }) => {
        closeVerseScopes(workspace);
        const element = context.sequences[0].element;
        const vn = element.atts['number'];
        let va = [parseInt(vn)];

        if (vn.includes('-')) {
          let [vs, ve] = vn.split('-').map(s => parseInt(s));
          va = [vs];

          while (vs <= ve) {
            vs++;
            va.push(vs);
          }
        }

        for (const v of va) {
          const verseScope = `verse/${v}`;
          workspace.os.push(verseScope);

          if (!workspace.block.is.includes(verseScope)) {
            workspace.block.is.push(verseScope);
          }
          workspace.block.items.push({
            type: 'scope',
            subType: 'start',
            payload: verseScope,
          });
        }

        const versesScope = `verses/${element.atts['number']}`;

        if (!workspace.block.is.includes(versesScope)) {
          workspace.block.is.push(versesScope);
        }
        workspace.os.push(versesScope);
        workspace.block.items.push({
          type: 'scope',
          subType: 'start',
          payload: versesScope,
        });
      },
    },
  ],

  startMilestone: [
    {
      description: 'Add scope and update state',
      test: () => true,
      action: ({
        context,
        workspace,
      }) => {
        const element = context.sequences[0].element;
        const milestoneScope = `milestone/${element.subType.split(':')[1]}`;

        if (!workspace.block.is.includes(milestoneScope)) {
          workspace.block.is.push(milestoneScope);
        }
        workspace.os.push(milestoneScope);
        workspace.block.items.push({
          type: 'scope',
          subType: 'start',
          payload: milestoneScope,
        });

        for (const [attKey, attValue] of Object.entries(element.atts || {})) {
          const valueParts = attValue.toString().split(',');

          for (const [partN, part] of valueParts.entries()) {
            const attScope = `attribute/milestone/${element.subType.split(':')[1]}/${attKey}/${partN}/${part}`;

            if (!workspace.block.is.includes(attScope)) {
              workspace.block.is.push(attScope);
            }
            workspace.os.push(attScope);
            workspace.block.items.push({
              type: 'scope',
              subType: 'start',
              payload: attScope,
            });
          }
        }
      },
    },
  ],

  endMilestone: [
    {
      description: 'Remove scope and update state',
      test: () => true,
      action: ({
        context,
        workspace,
      }) => {
        const element = context.sequences[0].element;
        const attScopeRoot = `attribute/milestone/${element.subType.split(':')[1]}`;

        for (const att of [...workspace.os.filter(s => s.startsWith(attScopeRoot))].reverse()) {
          workspace.os = workspace.os.filter(o => o !== att);
          workspace.block.items.push({
            type: 'scope',
            subType: 'end',
            payload: att,
          });
        }

        const milestoneScope = `milestone/${element.subType.split(':')[1]}`;
        workspace.os = workspace.os.filter(s => s !== milestoneScope);
        workspace.block.items.push({
          type: 'scope',
          subType: 'end',
          payload: milestoneScope,
        });
      },
    },
  ],

  startWrapper: [
    {
      description: 'Add scope and update state',
      test: () => true,
      action: ({
        context,
        workspace,
      }) => {
        const element = context.sequences[0].element;
        const wrapperScope = `${element.subType === 'usfm:w' ? 'spanWithAtts' : 'span'}/${element.subType.split(':')[1]}`;

        if (!workspace.block.is.includes(wrapperScope)) {
          workspace.block.is.push(wrapperScope);
        }
        workspace.os.push(wrapperScope);
        workspace.block.items.push({
          type: 'scope',
          subType: 'start',
          payload: wrapperScope,
        });

        for (const [attKey, attValue] of Object.entries(element.atts || {})) {
          const valueParts = attValue.toString().split(',');

          for (const [partN, part] of valueParts.entries()) {
            const attScope = `attribute/spanWithAtts/w/${attKey}/${partN}/${part}`;

            if (!workspace.block.is.includes(attScope)) {
              workspace.block.is.push(attScope);
            }
            workspace.os.push(attScope);
            workspace.block.items.push({
              type: 'scope',
              subType: 'start',
              payload: attScope,
            });
          }
        }
      },
    },
  ],

  endWrapper: [
    {
      description: 'Remove scope and update state',
      test: () => true,
      action: ({
        context,
        workspace,
      }) => {
        const element = context.sequences[0].element;

        for (const [attKey, attValue] of [...Object.entries(element.atts || {})].reverse()) {
          const valueParts = attValue.toString().split(',');

          for (const [partN, part] of [...valueParts.entries()].reverse()) {
            const attScope = `attribute/spanWithAtts/w/${attKey}/${partN}/${part}`;
            workspace.os = workspace.os.filter(o => o !== attScope);
            workspace.block.items.push({
              type: 'scope',
              subType: 'end',
              payload: attScope,
            });
          }
        }

        const wrapperScope = `${element.subType === 'usfm:w' ? 'spanWithAtts' : 'span'}/${element.subType.split(':')[1]}`;
        workspace.os = workspace.os.filter(s => s !== wrapperScope);
        workspace.block.items.push({
          type: 'scope',
          subType: 'end',
          payload: wrapperScope,
        });
      },
    },
  ],

  text: [
    {
      description: 'Log occurrences',
      test: () => true,
      action: ({
        context,
        workspace,
      }) => {
        const text = context.sequences[0].element.text;
        const re = xre.union(lexingRegexes.map((x) => x[2]));
        const words = xre.match(text, re, 'all');

        for (const word of words) {
          let subType;

          if (xre.test(word, wordLikeRegex)) {
            subType = 'wordLike';
          } else if (xre.test(word, lineSpaceRegex)) {
            subType = 'lineSpace';
          } else if (xre.test(word, punctuationRegex)) {
            subType = 'punctuation';
          }
          workspace.block.items.push({
            type: 'token',
            subType,
            payload: word,
          });
        }
      },
    },
  ],

  endDocument: [
    {
      description: 'Rework hanging end cv scopes',
      test: () => true,
      action: ({ output }) => {
        const sequenceBlocks = Object.values(output.pkJson)[0];

        for (let blockN = 1; blockN < sequenceBlocks.length; blockN++) {
          let thisBlockItems = sequenceBlocks[blockN].items;
          const lastBlockItems = sequenceBlocks[blockN - 1].items;
          let itemN = 0;

          while (itemN < thisBlockItems.length) {
            const item = thisBlockItems[itemN];

            if (item.type !== 'scope' || item.subType !== 'end') {
              break;
            }
            itemN++;
          }

          while (itemN > 0) {
            const movingScope = thisBlockItems.shift();
            lastBlockItems.push(movingScope);
            sequenceBlocks[blockN].os = sequenceBlocks[blockN].os.filter(s => s !== movingScope.payload);
            itemN--;
          }
        }
      },
    },
  ],

};

const perf2PkJsonCode = function ({ perf }) {
  const cl = new PerfRenderFromJson(
    {
      srcJson: perf,
      ignoreMissingSequences: true,
      actions: perf2PkJsonActions,
    },
  );
  const output = {};

  cl.renderDocument({
    docId: '',
    config: {},
    output,
  });
  return { pkJson: output.pkJson };
};

const perf2PkJson = {
  name: 'perf2PkJson',
  type: 'Transform',
  description: 'PERF=>JSON: Converts PERF to current Proskomma input format',
  documentation: '',
  inputs: [
    {
      name: 'perf',
      type: 'json',
      source: '',
    },
  ],
  outputs: [
    {
      name: 'pkJson',
      type: 'json',
    },
  ],
  code: perf2PkJsonCode,
};
export default perf2PkJson;
