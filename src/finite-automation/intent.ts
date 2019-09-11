import { Coordinate } from './coordinate/coordinate';
import { SELECTION_MODE } from './selection-mode';
import { TextEditor } from 'vscode';
import { Configuration } from '../configuration';
import { ACTIVE_RELATIVE_TO_CONFIG } from '../configuration/active-relative-to';
import { TERMINAL } from '../grammar/terminal';

/** 
 * A builder type used to contain information parsed from the input with a finite automation. 
 * 
 * As the finite automation progresses, it gradually builds up an `Intent`. If the finite automation
 * terminates in an accept state, the resulting `Intent` will specify a selection to be made in the
 * document. However, if the finite automation rejects the input then the resulting `Intent` should
 * be discarded as it will contain undefined information.
 */
export class Intent {
    
    // TODO: Finish describing this
    public constructor(
        private readonly editor:        TextEditor, 
        private readonly configuration: Configuration
    ) {}

    /** 
     * If the `anchor` `Coordinate` contains `Relative` variants, then they will be calculated against
     * the position of the primary cursor.
     */
    private anchorReference: Position = this.editor.selection.active;

    /** Specifies the `anchor` position of the resulting `Selection`. */
    private anchor: Coordinate = {

        // By default the anchor is placed on the line that the primary cursor is on
        line: { kind: 'positiveRelative', magnitude: '' },

        // If left unspecified, the horizontal position will default to this
        character: shortcutTerminalToCharacterTerm(this.configuration.defaultCharacterBehavior)

    };



    /** 
     * If the `active` `Coordinate` contains `Relative` variants, then they will be calculated against
     * the `anchor` `Coordinate`.
     */
    private activeReference: Coordinate = this.anchor;

    /** Specifies the `anchor` position of the resulting `Selection`. */
    private _active: Coordinate | undefined;

    private get active(): Coordinate :

    /** 
     * Unless a 'selection separator token' is read, the input should be interpreted as a single 
     * location in the document to 'Go To' 
     */
    private selectionMode: SELECTION_MODE = SELECTION_MODE.NONE;

    // TODO: Create a constructor here and move the default initiailization from `Finite Automation`
    // to here
  
}

/** A unit formed from two terms that together specify a location in a text editor. */
interface Coordinate {

    /** Term representing the line number of the coordinate. */
    line: LineTerm | None;

    /** Term representing the character number of the coordinate. */
    character: CharacterTerm | None;

}

/** Type to represent a null case for line or character terms. */
interface None {
    kind: 'none';
}

interface Absolute { 
    kind: 'absolute';
    magnitude: string;
}

interface PositiveRelative { 
    kind: 'positiveRelative'; 
    magnitude: string;
}

interface NegativeRelative {
    kind: 'negativeRelative';
    magnitude: string;
}

/** 
 * Variant type to represent the `line` component of an input coordinate,
 * 
 * - `absolute` means an exact line number in the editor.
 * - `positiveRelative` means a line number that is relative in the positive direction (downwards).
 * - `negativeRelative` means a line number that is relative (in the negative direction (upwards).
 */
type LineTerm = Absolute | PositiveRelative | NegativeRelative;



// TODO: Actually we might be able to get away with using enums here instead of variants....

/** 
 * Variant type to represent the `character` component of an input coordinate,
 * 
 * - `absolute` means an exact character number in the editor.
 * - `positiveRelative` means a character number that is relative in the positive direction (rightwards).
 * - `negativeRelative` means a character number that is relative in the negative direction (leftwards).
 * 
 * In addition to the above, there is the possibility of shortcut terms,
 *
 * - `firstNonWhitespaceCharacterShortcut` means the first character from the start of line that is
 *   not whitespace. If there no non-whitespace characters in the line, then it defaults to the start
 *   of line.
 * - `onePastLastNonWhitespaceCharacterShortcut` means one character past the last non whitespace 
 *   character in the line. If there no non-whitespace characters in the line, then it defaults 
 *   to the start of line.
 * - `startOfLineShortcut` means character number 1.
 * - `endOfLineShortcut` means one past the last character including whitespace.
 */
export type CharacterTerm = 
    LineTerm 
    | FirstNonWhitespaceCharacterShortcut
    | OnePastLastNonWhitespaceCharacterShortcut
    | StartOfLineShortcut
    | EndOfLineShortcut;

interface StartOfLineShortcut {
    kind: 'startOfLineShortcut';
}

interface EndOfLineShortcut {
    kind: 'endOfLineShortcut';
}

interface FirstNonWhitespaceCharacterShortcut {
    kind: 'firstNonWhitespaceCharacterShortcut';
}

interface OnePastLastNonWhitespaceCharacterShortcut {
    kind: 'onePastLastNonWhitespaceCharacterShortcut';
}

/** The kind of selection the input describes. */
export enum SELECTION_MODE {

    /**
     * No selection mode specified. 
     * 
     * This means we should interpret the input as specifying a location in the document to 'Go To'.
     */
    NONE,

    /** Select a range defined by two input `Coordinates`. */
    SELECT,

    /** 
     * Select a range from cursor (more specifically the primary selection's `active`) to a target 
     * `Coordinate`. 
     */
    SELECT_FROM_CURSOR,

    /** 
     * Same as `SELECT` but the selection will expand to completely cover the start and end lines.
     * 
     * For instance, if a selection starts at line 5 character 20 and ends at line 10 character 40,
     * it will be expanded to start from the beginning of line 5 and end at the end of line 10.
     */
    QUICK_SELECT,

    /** 
     * Same expansion behavior as `QUICK_SELECT` but the `anchor` of the selection will be the 
     * primary selection's `active` before expansion.
     */
    QUICK_SELECT_FROM_CURSOR
    
}

    // TODO: Fix this




    /** Predicate function that returns true if `s` is one of the `SHORTCUT` tokens. */
    public static isShortcut(s: string): boolean {
        




    }



/** Convert a shortcut terminal to the corresponding `CharacterTerm` variant. */
function shortcutTerminalToCharacterTerm(shortcutTerminal: TERMINAL): CharacterTerm {
    switch (shortcutTerminal) {
        case TERMINAL.FIRST_NON_WHITESPACE_CHARACTER_SHORTCUT: 
            return { kind: 'firstNonWhitespaceCharacterShortcut' };
        case TERMINAL.ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_SHORTCUT:
            return { kind: 'onePastLastNonWhitespaceCharacterShortcut' };
        case TERMINAL.START_OF_LINE_SHORTCUT:
            return { kind: 'startOfLineShortcut' };
        case TERMINAL.END_OF_LINE_SHORTCUT:
            return { kind: 'endOfLineShortcut' };
        default: 
            throw new Error('Error: Must be shortcut terminal!');
    }
}


/** 
 * Convert this `Coordinate` to a VS Code `Position` type. While `Coordinate` uses a 1-based number 
 * for both line and character, `Position` uses a 0-based index.
 * 
 * When converting, rounding will be applied, meaning that out of range values of both the line
 * or character terms will be rounded down to the nearest extreme values such that they both fit
 * within `document`.
 * 
 * @param document The document that the `coordinate` is in.
 * @param coordinate A location within `document`.
 * @param reference The reference position used to calculate relative coordinates.
 * @param lineTermDefaultsTo `coordinate.line` will default to this if it is of `none` kind.
 * @param characterTermDefaultsTo `coordinate.character` will default to this if it is of `none` kind.
 * @return The `Position` within `document` that `coordinate` specified.
 */
function coordinateToPosition(args: {
    document:                Readonly<TextDocument>,
    coordinate:              Coordinate,
    reference:               Position,
    lineTermDefaultsTo:      LineTerm,
    characterTermDefaultsTo: CharacterTerm
}): Position 
{
    const { document, coordinate, reference, lineTermDefaultsTo, characterTermDefaultsTo } = args;
    const lineTerm       = coordinate.line.kind      === 'none' ? lineTermDefaultsTo      : coordinate.line;
    const characterTerm  = coordinate.character.kind === 'none' ? characterTermDefaultsTo : coordinate.character;
    const lineIndex      = lineTermToIndex(reference.line, document, lineTerm);
    const characterIndex = characterTermToIndex(reference.character, document.lineAt(lineIndex), characterTerm);
    return new Position(lineIndex, characterIndex);

    /** Limit `num` to within a range. Both bounds are inclusive. */
    function limit(num: number, lower: number, upper: number): number {
        return num > upper ? upper : (num < lower ? lower : num);
    }

    /** Get a line index which is guaranteed to be bound within `document`. */
    function lineTermToIndex(referenceLineIndex: number, document: Readonly<TextDocument>, term: LineTerm): number {
        const val = (() => {
            switch (term.kind) {
                case 'absolute': 
                    return Number.parseInt(term.magnitude) - 1;
                case 'negativeRelative':
                    return referenceLineIndex - Number.parseInt(term.magnitude);
                case 'positiveRelative':
                    return referenceLineIndex + Number.parseInt(term.magnitude);
                default:
                    throw new Error('Unreachable!');
            }
        })();
        return limit(val, 0, document.lineCount - 1);
    }

    /** Get a character index which is guaranteed to be bound within a `targetLine`. */
    function characterTermToIndex(referenceCharacterIndex: number, targetLine: TextLine, term: CharacterTerm): number {
        const val = (() => {
            switch (term.kind) {
                case 'absolute': 
                    return Number.parseInt(term.magnitude) - 1;
                case 'negativeRelative':
                    return referenceCharacterIndex - Number.parseInt(term.magnitude);
                case 'positiveRelative':
                    return referenceCharacterIndex + Number.parseInt(term.magnitude);
                case 'firstNonWhitespaceCharacterShortcut':
                    return getFirstNonWhitespaceCharacterIndex(targetLine.text, 0);
                case 'onePastLastNonWhitespaceCharacterShortcut':
                    return getOnePastLastNonWhitespaceCharacterIndex(targetLine.text, 0);
                case 'startOfLineShortcut':
                    return 0;
                case 'endOfLineShortcut':
                    return targetLine.range.end.character;
                default:
                    throw new Error('Unreachable!');
            }
        })();
        return limit(val, 0, targetLine.range.end.character);

        /** 
         * Get the first non-whitespace character index of a string. `defaultTo` is returned if the 
         * string is all whitespace.
         */
        function getFirstNonWhitespaceCharacterIndex(str: string, defaultTo: number): number {
            for (let i = 0; i < str.length; ++i) {
                if (!/\s/.exec(str[i])) {
                    return i;
                }
            }
            return defaultTo;
        }

        /** 
         * Get one past the last non-whitespace character index of a string. `defaultTo` is returned 
         * if the string is all whitespace.
         */
        function getOnePastLastNonWhitespaceCharacterIndex(str: string, defaultTo: number): number {
            for (let i = str.length - 1; i >= 0; --i) {
                if (!/\s/.exec(str[i])) {
                    return i + 1;
                }
            }
            return defaultTo;
        }
    }

}

/** 
 * Get a `Selection` that has:
 * - `anchor` at the start of `anchorLine`.
 * - `active` at the end of `activeLine`.
 */
function quickSelectionFrom(anchorLine: TextLine, activeLine: TextLine): Selection {
    if (activeLine.lineNumber >= anchorLine.lineNumber) {
        return new Selection(anchorLine.range.start, activeLine.range.end);
    } else {
        return new Selection(anchorLine.range.end, activeLine.range.start);
    }
}



/**
 * Parse an input string to get a selection in a text editor.
 * 
 * @param input The input string from the dialog (all whitespace will be ignored).
 * @param editor The text editor that the dialog is opened in. 
 * @param configuration The current configuration of the extension.
 * @return `Selection` specified by the input. But `undefined` if the input is rejected. The return 
 *         `Selection` will be empty if the input specifies a 'Go To'. 
 */
export function parseInput(
    input:         string, 
    editor:        Readonly<TextEditor>, 
    configuration: Configuration
): Selection | undefined 
{
    const intent = runFiniteAutomation(input);
    if (!intent) {
        // Rejection
        return undefined;
    }
    const anchor = coordinateToPosition({
        document:                editor.document,
        coordinate:              intent.anchor,
        /* Intuitively the user expects the relative position of the anchor to be calculated with
        respect to the cursor's position when the dialog is first opened.*/
        reference:               editor.selection.active,
        // If the line term is omitted, we default to using the cursor's line number
        lineTermDefaultsTo:      { kind: 'positiveRelative', magnitude: '0' },
        characterTermDefaultsTo: configuration.defaultCharacterBehavior
    });
    const getActive = () => coordinateToPosition({
        document:                editor.document,
        coordinate:              intent.active,
        reference:               configuration.activeRelativeTo === ACTIVE_RELATIVE_TO.ANCHOR ? anchor : editor.selection.active,
        // Default to the `reference`'s line number if line term is omitted
        lineTermDefaultsTo:      { kind: 'positiveRelative', magnitude: '0' },
        characterTermDefaultsTo: configuration.defaultCharacterBehavior,
    });
    switch (intent.selectionMode) {
        case SELECTION_MODE.GOTO:
            return new Selection(
                anchor, 
                anchor
            );
        case SELECTION_MODE.SELECT: 
            return new Selection(
                anchor, 
                getActive()
            );
        case SELECTION_MODE.SELECT_FROM_CURSOR:
            return new Selection(
                editor.selection.active, 
                getActive()
            );
        case SELECTION_MODE.QUICK_SELECT:
            return quickSelectionFrom(
                editor.document.lineAt(anchor),
                editor.document.lineAt(getActive())
            );
        case SELECTION_MODE.QUICK_SELECT_FROM_CURSOR:
            return quickSelectionFrom(
                editor.document.lineAt(editor.selection.active),
                editor.document.lineAt(getActive())
            );
        default: 
            throw new Error('Unreachable!');
    }
}

