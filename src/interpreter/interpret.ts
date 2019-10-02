import { VarTarget, VarPosition, VarColumn, VarLine, VarRangeEnd } from './parser/var';
import { parse } from './parser/parse';
import { tokenize } from './tokenizer/tokenize';
import { Position, Selection, TextEditor, TextLine, TextDocument } from 'vscode';
import { COLUMN_DEFAULTS_TO } from '../config/column-defaults-to';
import { Config } from '../config/config';
import { Target } from './target';

//! Note that any numbers parsed from the input is `1`-based, in that it starts from `1` (because 
//! that is how the editor labels the lines and columns in the UI). However VS Code deals with 
//! `0`-based numbers internally, so we have to perform the conversions from `1`-based to `0`-based 
//! when necessary.

/** 
 * Convert the input string into the target that it specifies.
 * 
 * `undefined` will be returned if the input string:
 *  1. Contains unknown characters.
 *  2. Has a syntax error.
 *  3. Is empty. 
 * 
 * An `editor` instance to the current active text editor needs to be passed to this function 
 * because the interpretation could be context sensitive. For instance, a 'select from cursor' needs 
 * to know the cursor's current position in order to construct the selection.
 * 
 * `config` contains the configuration of the extension.
 */
export function interpret(
    input: string, 
    editor: Readonly<TextEditor>, 
    config: Config
): Target | undefined 
{
    const tokenStream = tokenize(input);
    if (!tokenStream) {
        return undefined;
    }
    const syntaxTree = parse(tokenStream);
    if (!syntaxTree) {
        return undefined;
    } else {
        // The `TARGET` variable is also the root of our syntax tree since it's the start variable.
        return interpretTarget(syntaxTree, editor, config);
    }
}

/** 
 * Interpret a `TARGET` variable and convert it into a `Target` type describing the target specified
 * by the input string.
 */
function interpretTarget(
    varTarget: VarTarget,
    editor: Readonly<TextEditor>, 
    config: Config
): Target
{
    switch (varTarget.kind) {
        case 'startWithOptionalRangeEnd': {
            // At least the start position has been specified.
            const start = interpretPosition(varTarget.start, editor, config);
            if (varTarget.end) {
                // End position was specified, this means we make a selection.
                const { end, quick } = interpretRangeEnd(varTarget.end, editor, config);
                return {
                    kind: 'selection',
                    selection: quick ? quickSelection(start, end) : new Selection(start, end),
                    quick
                };
            } else {
                // No end position means we just have a position to 'go to'.
                return { 
                    kind: 'goTo', 
                    position: start 
                };
            }
        }
        case 'rangeEndOnly': {
            // Use the cursor position as the start of the selection.
            const cursor = editor.selection.active;
            const { end, quick } = interpretRangeEnd(varTarget.end, editor, config);
            return {
                kind: 'selection',
                selection: quick ? quickSelection(cursor, end) : new Selection(cursor, end),
                quick
            };
        }
    }

    /** 
     * Create a quick selection from two positions. This creates a selection that covers entirely
     * the lines that `start` and `end` are on, as well as all the lines that are in between. 
     * However the location of the `anchor` and `active` positions of the resulting selection
     * depends on whether `start` is before `end` or not. 
     * 
     * In general: 
     * - If `end` has a line number greater than or equal to `start`'s then the `active` position 
     *   will be at the end of `end`'s line, and the `anchor` position will be at the start of 
     *   `start`'s line.
     * - Otherwise if `end` has a line number smaller than `start`'s then the `active` position will 
     *   be at the start of `end`'s line while the `anchor` position will be at the end of `start`'s
     *   line.
     */
    function quickSelection(start: Position, end: Position): Selection {
        const startLine = editor.document.lineAt(start);
        const endLine   = editor.document.lineAt(end);
        // Note that VS Code has different notions of `start` and `end` positions. When we say 
        // `start` what we really mean is VS Code's `anchor` position. Similarly when we say `end` 
        // we really the `active` position.
        if (endLine.lineNumber >= startLine.lineNumber) {
            return new Selection(startLine.range.start, endLine.range.end);
        } else {
            return new Selection(startLine.range.end, endLine.range.start);
        }
    }

}
    
/**
 * Interpret a `RANGE_END` variable and convert it into a VS Code `Position` type pointing at the 
 * location where the selection ends in the document. The `quick` boolean in the return value signals
 * whether the selection is a quick selection (see below), depending on whether the user input one
 * instead of two periods as the range token. 
 * 
 * Quick selection is a selection that is expanded to cover completely the lines that the selection
 * touches. More specifically, consider the `active` and `anchor` positions of a selection. Then 
 * whichever position comes after will be set to the end of the line that it is on, and whichever
 * position comes before will be set to the start of the line at it is on. This in effect would 
 * enable the user to quickly select entire lines without needing to specify the exact start and ends
 * of each line in the input.
 * 
 * `editor` is the active editor instance in which we are specifying the end position in.
 */
function interpretRangeEnd(
    varRangeEnd: VarRangeEnd, 
    editor: Readonly<TextEditor>, 
    config: Config
): { end: Position, quick: boolean }
{
    let end = interpretPosition(varRangeEnd.position, editor, config);
    switch (varRangeEnd.kind) {
        case 'period' :
            // Single period for quick selection.
            return { end, quick: true };
            // Two periods for detailed selection.
        case 'doublePeriod':
            return { end, quick: false };
    }
}

/** 
 * Interpret a `POSITION` variable and convert it into a VS Code `Position` type pointing at the
 * exact location in the document.
 * 
 * `editor` is the active editor instance in which we are getting the position in. We need this in
 * order to know the cursor's position, as well as knowing bounds of the document. This way we can
 * calculate `POSITION` variables which do not specify the line number by defaulting to the cursor's 
 * line number. Furthermore, knowing the the bounds makes sure that we return a `Position` type that
 * actually points to a valid position within the document.
 */
function interpretPosition(
    varPosition: VarPosition, 
    editor: Readonly<TextEditor>, 
    config: Config
): Position 
{
    switch (varPosition.kind) {
        case 'lineWithOptionalColumn': {
            // At least the line number has been specified. The column number (if not specified)
            // will default to that which is specified in the configuration.
            const lineInd = interpretLine(varPosition.line, editor.document);
            return new Position(
                lineInd, 
                interpretColumn(
                    varPosition.column ? varPosition.column : convertColumnDefaultsTo(),
                    editor.document.lineAt(lineInd)
                )   
            );
        }
        case 'columnOnly': {
            // Only column number specified. This means the line number defaults to the cursor's.
            const cursorLineInd = editor.selection.active.line;
            return new Position(
                cursorLineInd, 
                interpretColumn(
                    varPosition.column, 
                    editor.document.lineAt(cursorLineInd)
                )
            );
        }
    }

    /** 
     * The `columnDefaultsTo` configuration specifies the column number that we should default to if 
     * the column number is not specified. However the configuration is specified as a `string` 
     * `enum`. This function converts that value to a `COLUMN` variable that can be used internally.
     */
    function convertColumnDefaultsTo(): VarColumn {
        switch (config.columnDefaultsTo) {
            case COLUMN_DEFAULTS_TO.START_OF_LINE: {
                return { kind: 'H' };
            }
            case COLUMN_DEFAULTS_TO.END_OF_LINE: {
                return { kind: 'L' };
            }
            case COLUMN_DEFAULTS_TO.FIRST_NON_WHITESPACE_CHARACTER_OF_LINE: {
                return { kind: 'h' };
            }
            case COLUMN_DEFAULTS_TO.ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_OF_LINE: {
                return { kind: 'l' };
            }
        }
    }
}   

/**
 * Interpret a `LINE` variable and convert it into a `0`-based line index.
 * 
 * `document` is the document which we are line-indexing into. We need this in order to know if the
 * input has specified a line index that is out of bounds so that we can round down to the nearest
 * extrema. For instance, if we have line index `112` in a line which only has `100` lines then we
 * have to round it down to `99`.
 */
function interpretLine(varLine: VarLine, document: Readonly<TextDocument>): number {
    const documentEndInd = document.lineCount - 1;
    switch (varLine.kind) {
        case 'numberOnly': {
            // Exact line number specified. Convert number to `0`-based index by subtracting `1`.
            return round(varLine.value - 1);
        }
        case 'minusPrefix': {
            // Line number relative to the bottom of the document specified.
            return round(documentEndInd - varLine.value);
        }
    }

    function round(ind: number): number {
        return ind < 0 ? 0 : (ind > documentEndInd ? documentEndInd : ind);
    }
}

/** 
 * Interpret a `COLUMN` variable and convert it into a `0`-based column index. 
 * 
 * The `targetLine` is the line which we are column-indexing into. We need this in order to know
 * whether the input has specified a column index that is out of bounds so that we have to round 
 * down to the nearest extrema. For instance, if we have column index `72` in a line which only has 
 * `30` characters, then we have to round it down to the end of the line which is at index `30`.
 */
function interpretColumn(varColumn: VarColumn, targetLine: Readonly<TextLine>): number {
    const { text: lineText, range: { end: { character: lineEndInd } } } = targetLine;
    switch (varColumn.kind) {
        case 'number': {
            // Exact column number specified. Convert number to `0`-based index by subtracting `1`.
            const ind = varColumn.value - 1;
            // Round down to nearest extrema.
            return ind < 0 ? 0 : (ind > lineEndInd ? lineEndInd : ind);
        }
        case 'H': {
            // Shortcut to the start of the line specified.
            return 0;
        }
        case 'L': {
            // Shortcut to the end of the line specified.
            return lineEndInd;
        }
        case 'h': {
            // Shortcut to the first non-whitespace character specified. This defaults to the start 
            // of line if the line is empty.
            return firstNonWhitespaceCharacterIndex(lineText);
        }
        case 'l': {
            // Shortcut to one character past the last non-whitespace specified. This defaults to 
            // the start of line if the line is empty.
            return onePastLastNonWhitespaceCharacterIndex(lineText);
        }
    }

    /** Defaults to `0` if `str` is all whitespace. */
    function firstNonWhitespaceCharacterIndex(str: string): number {
        for (let i = 0; i < str.length; ++i) {
            if (!/\s/.exec(str[i])) {
                return i;
            }
        }
        return 0;
    }

    /** Defaults to `0` if `str` is all whitespace. */
    function onePastLastNonWhitespaceCharacterIndex(str: string,): number {
        for (let i = str.length - 1; i >= 0; --i) {
            if (!/\s/.exec(str[i])) {
                return i + 1;
            }
        }
        return 0;
    }
}