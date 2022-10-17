import {PerfRenderFromJson} from 'proskomma-json-tools';

const initialBlockRecord = ct => ({
    type: ct.sequences[0].block.type,
    subType: ct.sequences[0].block.subType,
    pos: ct.sequences[0].block.blockN,
    perfChapter: null,
});

const calculateUsfmChapterPositionsActions = {
    startDocument: [
        {
            description: "Set up storage",
            test: () => true,
            action: ({workspace, output}) => {
                workspace.blockRecords = [];
                output.report = {};
            }
        },
    ],
    startParagraph: [
        {
            description: "Set up block record",
            test: () => true,
            action: ({context, workspace, output}) => {
                workspace.blockRecords.push(initialBlockRecord(context));
            }
        },
    ],
    blockGraft: [
        {
            description: "Set up block record",
            test: () => true,
            action: ({context, workspace, output}) => {
                workspace.blockRecords.push(initialBlockRecord(context));
            }
        },
    ],
    mark: [
        {
            description: "Add chapter number to block record",
            test: ({context}) => context.sequences[0].element.subType === "chapter",
            action: ({config, context, workspace, output}) => {
                workspace.blockRecords[workspace.blockRecords.length - 1].perfChapter = context.sequences[0].element.atts["number"];
            }
        }
    ],
    endDocument: [
        {
            description: "Populate report",
            test: () => true,
            action: ({workspace, output}) => {
                for (const [recordN, record] of Object.entries(workspace.blockRecords)) {
                    if (!record.perfChapter) {
                        continue;
                    }
                    let usfmChapterPos = recordN;
                    let found = false;
                    while (usfmChapterPos > 0 && !found) {
                        if (workspace.blockRecords[usfmChapterPos - 1].type === 'paragraph'
                            || workspace.blockRecords[usfmChapterPos - 1].subType === 'title') {
                            found = true;
                        } else {
                            usfmChapterPos--;
                        }
                    }
                    output.report[usfmChapterPos.toString()] = record.perfChapter;
                }
            }
        },
    ],
};

const calculateUsfmChapterPositionsCode = function ({perf}) {
    const cl = new PerfRenderFromJson({srcJson: perf, actions: calculateUsfmChapterPositionsActions});
    const output = {};
    cl.renderDocument({docId: "", config: {maxLength: 60}, output});
    return {report: output.report};
}

const calculateUsfmChapterPositions = {
    name: "calculateUsfmChapterPositions",
    type: "Transform",
    description: "PERF=>JSON: Generates positions for inserting chapter numbers into USFM",
    inputs: [
        {
            name: "perf",
            type: "json",
            source: ""
        },
    ],
    outputs: [
        {
            name: "report",
            type: "json",
        }
    ],
    code: calculateUsfmChapterPositionsCode
}

export default calculateUsfmChapterPositions;
