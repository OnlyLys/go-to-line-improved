import { runSuite as runParserTestSuite } from './parser.test';
import { Selection, TextEditor } from 'vscode';
import { openLoremIpsum } from './test-utilities.test';

/** 
 * This is the initial state of the primary selection. We give it an arbitrary selection from row 
 * 50, column 50 to row 60, column 60. 
 * 
 * Note that VS Code stores positions in 0-based numbers so we have subtracted each value by 1 when
 * creating a `Selection` type.
 */
export const INITIAL_SELECTION = new Selection(49, 49, 59, 59);

/** The `lorem-upsum.txt` that is used as a basis for our tests. */
export const loremIpsumEditor: Promise<TextEditor> = openLoremIpsum(INITIAL_SELECTION);

function testMain(): void {
    runParserTestSuite();
}

testMain();
