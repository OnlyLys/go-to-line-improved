import * as assert from 'assert';
import { extensions, Selection, window, Uri, TextEditor } from 'vscode';
import { EXT_IDENT } from '../extension';

/** 
 * The following array contains the length of each line in the 'lorem-ipsum.txt' document. 
 * 
 * The zeroth element of this array corresponds to the line length of the first line in the document.
 * Note that these numbers are naturally 0-based since they quantify length.
 */
const LOREM_IPSUM_LINE_LENGTHS = [
    88, 0, 20, 4, 99, 107, 108, 121, 133, 4, 100, 109, 108, 134, 4, 113, 103, 112, 110, 119, 78, 4, 
    103, 103, 113, 114, 117, 83, 4, 120, 126, 130, 135, 143, 28, 4, 101, 104, 108, 110, 70, 0, 100, 
    99, 105, 112, 115, 72, 4, 101, 104, 105, 107, 114, 122, 121, 125, 4, 98, 103, 110, 89, 0, 100, 
    109, 108, 134, 0, 113, 103, 112, 110, 119, 78, 4, 103, 103, 113, 114, 117, 83, 4, 120, 126, 130,
    135, 143, 28, 4, 101, 104, 105, 107, 114, 122, 121, 125, 0, 0, 22
];

/**
 * Type alias of 4-tuple to contain the values for a selection in 1-based numbers. Each element in 
 * the tuplet are from left to right: 
 * - `anchor` line number
 * - `anchor` character number
 * - `active` line number
 * - `active` character number
 * 
 * Note that when we talk about line or character 'numbers', we mean numbers that are 1-based. 
 * Internally, however, VS Code stores all positions with indices that start from 0. To reduce 
 * ambiguity, we refer to 0-based line or character numbers as 'indices' and 1-based values will be 
 * called 'number'. For example, line number 50, character number 50 will have line index 49, character 
 * index 49.
 */
export type SelectionOneBased = [number, number, number, number];

/** Get the quick selection of a 1-based selection. */
export function getQuickSelectionOneBased(selectionOneBased: SelectionOneBased): SelectionOneBased {
    const anchorLineNum = selectionOneBased[0];
    const activeLineNum = selectionOneBased[2];
    if (anchorLineNum <= activeLineNum) {
        return [
            anchorLineNum, 
            1, 
            activeLineNum, 
            LOREM_IPSUM_LINE_LENGTHS[activeLineNum - 1] + 1
        ];
    } else {
        return [
            anchorLineNum, 
            LOREM_IPSUM_LINE_LENGTHS[anchorLineNum - 1] + 1, 
            activeLineNum, 
            1
        ];
    }
}

/** 
 * Type to contain an input string to feed to the parser and the expected output from the parser in 
 * 1-based numbers (see `SelectionOneBased` for more information).
 * 
 * If `expect` is `null`, that means we expect the parser to reject the input.
 */
export type Input = { 
    str: string, 
    expect: SelectionOneBased | undefined,
};

/**
 * Open a 'lorem-ipsum' text document for testing. The cursor is set to `INITIAL_SELECTION` and that 
 * is used as a starting point to test the extension.
 */
export async function openLoremIpsum(startingSelection: Selection): Promise<TextEditor> {
    const extension = extensions.getExtension(`OnlyLys.${EXT_IDENT}`);
    if (extension) {
        const loremIpsumFilePath = extension.extensionPath + '/test-documents/lorem-ipsum.txt';
        // Open the lorem-ipsum file in the editor
        const loremIpsumEditor = await window.showTextDocument(Uri.file(loremIpsumFilePath));
        loremIpsumEditor.selection = startingSelection;
        return loremIpsumEditor;
    } else {
        throw new Error('Unable to open lorem-ipsum test file!');
    }
}

/**
 * Parse the input string in an `Input` type and check that the returned result is as expected.
 * 
 * @param editor The editor that we execute the commands in.
 * @param settings The settings of the extension at the time of testing.
 * @param inputs The `Input`s that contain each contain an input string to pass to the parser as 
 * well as an expected output to compare to the parser's output.
 */
export function verifyInputs(editor: TextEditor, settings: Settings, inputs: Iterable<Input>): void {
    for (const input of inputs) {
        assert.deepStrictEqual(
            Parser.parse(input.str, editor, settings), 
            getSelection(input), 
            `Result From Parser Does Not Match Expected Value (Caused By Input: ${input.str})`
        );
    }

    /** 
     * Convert the 1-based selection in an `Input` to 0-based. This function may throw if the
     * conversion fails (e.g. due to any post-converted numbers being negative).
     * 
     * If the 1-based selection was initially `undefined` then the return value is `undefined`. 
     * Otherwise the return value is never `undefined`.
     */
    function getSelection(input: Input): Selection | undefined {
        if (!input.expect) {
            return undefined;
        } else {
            try {
                const [a, b, c, d] = input.expect;
                return new Selection(a - 1, b - 1, c - 1, d - 1);
            } catch (err) {
                throw new Error(`${err} (Selection Conversion Failure: Caused By Input: ${input.str})`);
            }
        }
    }
}
