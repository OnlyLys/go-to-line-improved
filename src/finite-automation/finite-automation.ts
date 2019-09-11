import { Intent } from './intent';
import { ACCEPT_STATES } from './states/,accept-states';
import { SELECTION_MODE } from './selection-mode';
import { TERMINAL } from '../grammar/terminal';

/** 
 * The finite automation as described by the graph `graph.gv` (located in the extension's root 
 * directory). 
 */
export class FiniteAutomation {

    /**
     * Create a new finite automation. 
     * 
     * Once created, it can only be advanced and cannot be reset. If a fresh finite automation is 
     * needed, another instance must be created.
     */
    public constructor() {}

    private currentState: STATES = STATES.START;

    public get isAcceptState(): boolean {
        return ACCEPT_STATES.includes(this.currentState);
    }

    // TODO: Move this initiailizer into the `Intent` class type
    private _intent: Intent = {
        anchor: { line: { kind: 'none' }, character: { kind: 'none' } },
        active: { line: { kind: 'none' }, character: { kind: 'none' } },
        /* Unless one of the 'SELECT_SEPARATOR' tokens are read, we interpret the user input as 
        specifying a single location in the document to go to. */
        selectionMode: SELECTION_MODE.GOTO
    };

    /** 
     * The finite automation's interpretation of the input that has been read so far. 
     * 
     * This will be `undefined` if the input has been rejected.
     * */
    public get intent(): Readonly<Intent> {
        return this._intent;
    }

    // TODO: Make this section simpler after the statemap is constructed
    /** 
     * Attempt to advance the finite automation once by reading a single token.
     * 
     * If the input `token` is accepted, the finite automation is advanced and `true` is returned.
     * Otherwise the `token` is rejected and `false` is returned. 
     */
    public advance(token: string): boolean {
        // Go through the state map to find a matching transition for the token
        for (const { source, destination, condition, callback } of STATE_MAP) {
            if (this.currentState !== source) {
                continue;
            }
            if (typeof condition === 'string') {
                if (token !== condition) {
                    continue;
                }
            } else {
                if (!condition(token)) {
                    continue;
                }
            }
            /* We get here if an appropriate transition is found, i.e. a transition from the current 
            state where there token matches the conditional. Thus we can advance the finite automation
            and build the `Intent`. */
            this.currentState = destination;
            callback(this._intent, token);
            return true;
        }
        // We get here if a matching transition cannot be found, i.e. the token is rejected
        return false;
    }

    // TODO: Make this a method of the Finite Automation
    /** 
 * Get the meaning of the input by running it through the finite automation. Will return `undefined`
 * if rejected by the finite automation.
 */
function runFiniteAutomation(input: string): Intent | undefined {
    const finiteAutomation = new FiniteAutomation();
    for (const token of stripWhitespace(input)) {
        if (!finiteAutomation.advance(token)) {
            // Rejection
            return undefined;
        }
    }
    if (!finiteAutomation.isAcceptState) {
        return undefined;
    }
    return finiteAutomation.intent;

    function stripWhitespace(str: string): string {
        return str.replace(/\s+/g,'');
    }
}



}

/** All possible states of the finite automation. */
enum STATE {
    START,
    ANCHOR_LINE,
    ANCHOR_LINE_SIGN_PREFIX,
    ANCHOR_CHAR,
    ANCHOR_CHAR_SHORTCUT,
    ANCHOR_CHAR_SIGN_PREFIX,
    ANCHOR_COORDINATE_SEPARATOR,
    ACTIVE_START,
    ACTIVE_LINE,
    ACTIVE_LINE_SIGN_PREFIX,
    ACTIVE_CHAR,
    ACTIVE_CHAR_SHORTCUT,
    ACTIVE_CHAR_SIGN_PREFIX,
    ACTIVE_COORDINATE_SEPARATOR
}

/** Subset of states where the finite automation is allowed to terminate in a success. */
const ACCEPT_STATES: ReadonlyArray<STATES> = [
    STATES.ANCHOR_LINE,
    STATES.ANCHOR_CHAR,
    STATES.ANCHOR_CHAR_SHORTCUT,
    STATES.ACTIVE_LINE,
    STATES.ACTIVE_CHAR,
    STATES.ACTIVE_CHAR_SHORTCUT
];

const DIGIT_TERMINALS: ReadonlyArray<TERMINAL> = [
    TERMINAL.ONE,
    TERMINAL.TWO,
    TERMINAL.THREE,
    TERMINAL.FOUR,
    TERMINAL.FIVE,
    TERMINAL.SIX,
    TERMINAL.SEVEN,
    TERMINAL.EIGHT,
    TERMINAL.NINE
];

/**
 * Array describing all the transitions of the finite automation.
 * 
 * Each element here describes a transition from a `source` state to a `destination` state. A 
 * transition is only allowed if the input token matches the transition's `condition`.
 * 
 * When a transition occurs, the associated `callback` will be used to modify the provided `Intent` 
 * to contain the intention associated with the transition.
 */
const TRANSITIONS: ReadonlyArray<{ 
    id:          string,
    source:      STATE, 
    destination: STATE, 
    /** 
     * If the condition is an array of terminals then the condition is considered fulfilled if 
     * the token matches any element
     */
    condition:   TERMINAL | ReadonlyArray<TERMINAL>,
    callback:    (intent: Intent, token: string) => void 
}> = 
[
    // Transitions for anchor term
    {
        id:          'ANCHOR_LINE_REL_NEG',
        source:      STATE.START,
        destination: STATE.ANCHOR_LINE_SIGN_PREFIX,
        condition:   TERMINAL.NEGATIVE_SIGN_PREFIX,
        callback:    (intent) => intent.anchor.line = { kind: 'negativeRelative', magnitude: '' }
    },
    {
        id:          'ANCHOR_LINE_REL_POS',
        source:      STATE.START,
        destination: STATE.ANCHOR_LINE_SIGN_PREFIX,
        condition:   TERMINAL.POSITIVE_SIGN_PREFIX,
        callback:    (intent) => intent.anchor.line = { kind: 'positiveRelative', magnitude: '' }
    },
    {
        id:          'ANCHOR_LINE_ABS',
        source:      STATE.START,
        destination: STATE.ANCHOR_LINE,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => intent.anchor.line = { kind: 'absolute', magnitude: token }
    },
    {
        id:          'ANCHOR_LINE_REL_MAG',
        source:      STATE.ANCHOR_LINE_SIGN_PREFIX,
        destination: STATE.ANCHOR_LINE,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => {
            switch (intent.anchor.line.kind) {
                case 'positiveRelative': 
                case 'negativeRelative': 
                    intent.anchor.line.magnitude += token;
                    break;
                default: 
                    throw new Error('Unreachable!');
            }
        }
    },
    {
        id:          'ANCHOR_LINE_MAG',
        source:      STATE.ANCHOR_LINE,
        destination: STATE.ANCHOR_LINE,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => {
            switch (intent.anchor.line.kind) {
                case 'absolute':
                case 'positiveRelative': 
                case 'negativeRelative': 
                    intent.anchor.line.magnitude += token;       
                    break;
                default: 
                    throw new Error('Unreachable!');
            }
        }
    },
    {
        id:          'ANCHOR_SEP_1',
        source:      STATE.START,
        destination: STATE.ANCHOR_COORDINATE_SEPARATOR,
        condition:   TERMINAL.COORDINATE_SEPARATOR,
        callback:    () => {}
    },
    {
        id:          'ANCHOR_SEP_2',
        source:      STATE.ANCHOR_LINE,
        destination: STATE.ANCHOR_COORDINATE_SEPARATOR,
        condition:   TERMINAL.COORDINATE_SEPARATOR,
        callback:    () => {}
    },
    {
        id:          'ANCHOR_SHORT_1A',
        source:      STATE.START,
        destination: STATE.ANCHOR_CHAR_SHORTCUT,
        condition:   TERMINAL.FIRST_NON_WHITESPACE_CHARACTER_SHORTCUT,
        callback:    (intent) => intent.anchor.character = { kind: 'firstNonWhitespaceCharacterShortcut' }
    },
    {
        id:          'ANCHOR_SHORT_1B',
        source:      STATE.START,
        destination: STATE.ANCHOR_CHAR_SHORTCUT,
        condition:   TERMINAL.ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_SHORTCUT,
        callback:    (intent) => intent.anchor.character = { kind: 'onePastLastNonWhitespaceCharacterShortcut' }
    },
    {
        id:          'ANCHOR_SHORT_1C',
        source:      STATE.START,
        destination: STATE.ANCHOR_CHAR_SHORTCUT,
        condition:   TERMINAL.START_OF_LINE_SHORTCUT,
        callback:    (intent) => intent.anchor.character = { kind: 'startOfLineShortcut' }
    },
    {
        id:          'ANCHOR_SHORT_1D',
        source:      STATE.START,
        destination: STATE.ANCHOR_CHAR_SHORTCUT,
        condition:   TERMINAL.END_OF_LINE_SHORTCUT,
        callback:    (intent) => intent.anchor.character = { kind: 'endOfLineShortcut' }
    },
    {
        id:          'ANCHOR_SHORT_2A',
        source:      STATE.ANCHOR_LINE,
        destination: STATE.ANCHOR_CHAR_SHORTCUT,
        condition:   TERMINAL.FIRST_NON_WHITESPACE_CHARACTER_SHORTCUT,
        callback:    (intent) => intent.anchor.character = { kind: 'firstNonWhitespaceCharacterShortcut' }
    },
    {
        id:          'ANCHOR_SHORT_2B',
        source:      STATE.ANCHOR_LINE,
        destination: STATE.ANCHOR_CHAR_SHORTCUT,
        condition:   TERMINAL.ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_SHORTCUT,
        callback:    (intent) => intent.anchor.character = { kind: 'onePastLastNonWhitespaceCharacterShortcut' }
    },
    {
        id:          'ANCHOR_SHORT_2C',
        source:      STATE.ANCHOR_LINE,
        destination: STATE.ANCHOR_CHAR_SHORTCUT,
        condition:   TERMINAL.START_OF_LINE_SHORTCUT,
        callback:    (intent) => intent.anchor.character = { kind: 'startOfLineShortcut' }
    },
    {
        id:          'ANCHOR_SHORT_2D',
        source:      STATE.ANCHOR_LINE,
        destination: STATE.ANCHOR_CHAR_SHORTCUT,
        condition:   TERMINAL.END_OF_LINE_SHORTCUT,
        callback:    (intent) => intent.anchor.character = { kind: 'endOfLineShortcut' }
    },
    {
        id:          'ANCHOR_CHAR_REL_NEG',
        source:      STATE.ANCHOR_COORDINATE_SEPARATOR,
        destination: STATE.ANCHOR_CHAR_SIGN_PREFIX,
        condition:   TERMINAL.NEGATIVE_SIGN_PREFIX,
        callback:    (intent) => intent.anchor.character = { kind: 'negativeRelative', magnitude: '' }
    },
    {
        id:          'ANCHOR_CHAR_REL_POS',
        source:      STATE.ANCHOR_COORDINATE_SEPARATOR,
        destination: STATE.ANCHOR_CHAR_SIGN_PREFIX,
        condition:   TERMINAL.POSITIVE_SIGN_PREFIX,
        callback:    (intent) => intent.anchor.character = { kind: 'positiveRelative', magnitude: '' }
    },
    {
        id:          'ANCHOR_CHAR_ABS',
        source:      STATE.ANCHOR_COORDINATE_SEPARATOR,
        destination: STATE.ANCHOR_CHAR,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => intent.anchor.character = { kind: 'absolute', magnitude: token }
    },
    {
        id:          'ANCHOR_CHAR_REL_MAG',
        source:      STATE.ANCHOR_CHAR_SIGN_PREFIX,
        destination: STATE.ANCHOR_CHAR,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => {
            switch (intent.anchor.character.kind) {
                case 'positiveRelative': 
                case 'negativeRelative': 
                    intent.anchor.character.magnitude += token;
                    break;
                default:
                    throw new Error('Unreachable!');
            }
        }
    },
    {
        id:          'ANCHOR_CHAR_MAG',
        source:      STATE.ANCHOR_CHAR,
        destination: STATE.ANCHOR_CHAR,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => {
            switch (intent.anchor.character.kind) {
                case 'absolute':
                case 'positiveRelative': 
                case 'negativeRelative': 
                    intent.anchor.character.magnitude += token;       
                    break;
                default:
                    throw new Error('Unreachable!');
            }
        }
    },
    {
        id:          'SELECT_FROM_ANCHOR_SEP',
        source:      STATE.START,
        destination: STATE.ACTIVE_START,
        condition:   TERMINAL.SELECT_SEPARATOR,
        callback:    (intent) => intent.selectionMode = SELECTION_MODE.SELECT_FROM_CURSOR
    },
    {
        id:          'SELECT_FROM_ANCHOR_QUICK_SEP',
        source:      STATE.START,
        destination: STATE.ACTIVE_START,
        condition:   TERMINAL.QUICK_SELECT_SEPARATOR,
        callback:    (intent) => intent.selectionMode = SELECTION_MODE.QUICK_SELECT_FROM_CURSOR
    },
    {
        id:          'SELECT_SEP_1',
        source:      STATE.ANCHOR_LINE,
        destination: STATE.ACTIVE_START,
        condition:   TERMINAL.SELECT_SEPARATOR,
        callback:    (intent) => intent.selectionMode = SELECTION_MODE.SELECT
    },
    {
        id:          'SELECT_QUICK_SEP_1',
        source:      STATE.ANCHOR_LINE,
        destination: STATE.ACTIVE_START,
        condition:   TERMINAL.QUICK_SELECT_SEPARATOR,
        callback:    (intent) => intent.selectionMode = SELECTION_MODE.QUICK_SELECT
    },
    {
        id:          'SELECT_SEP_2',
        source:      STATE.ANCHOR_CHAR,
        destination: STATE.ACTIVE_START,
        condition:   TERMINAL.SELECT_SEPARATOR,
        callback:    (intent) => intent.selectionMode = SELECTION_MODE.SELECT
    },
    {
        id:          'SELECT_QUICK_SEP_2',
        source:      STATE.ANCHOR_CHAR,
        destination: STATE.ACTIVE_START,
        condition:   TERMINAL.QUICK_SELECT_SEPARATOR,
        callback:    (intent) => intent.selectionMode = SELECTION_MODE.QUICK_SELECT
    },    {
        id:          'SELECT_SEP_3',
        source:      STATE.ANCHOR_CHAR_SHORTCUT,
        destination: STATE.ACTIVE_START,
        condition:   TERMINAL.SELECT_SEPARATOR,
        callback:    (intent) => intent.selectionMode = SELECTION_MODE.SELECT
    },
    {
        id:          'SELECT_QUICK_SEP_3',
        source:      STATE.ANCHOR_CHAR_SHORTCUT,
        destination: STATE.ACTIVE_START,
        condition:   TERMINAL.QUICK_SELECT_SEPARATOR,
        callback:    (intent) => intent.selectionMode = SELECTION_MODE.QUICK_SELECT
    },

    // Transitions for active term
    {
        id:          'ACTIVE_LINE_REL_NEG',
        source:      STATE.ACTIVE_START,
        destination: STATE.ACTIVE_LINE_SIGN_PREFIX,
        condition:   TERMINAL.NEGATIVE_SIGN_PREFIX,
        callback:    (intent) => intent.active.line = { kind: 'negativeRelative', magnitude: '' }
    },
    {
        id:          'ACTIVE_LINE_REL_POS',
        source:      STATE.ACTIVE_START,
        destination: STATE.ACTIVE_LINE_SIGN_PREFIX,
        condition:   TERMINAL.POSITIVE_SIGN_PREFIX,
        callback:    (intent) => intent.active.line = { kind: 'positiveRelative', magnitude: '' }
    },
    {
        id:          'ACTIVE_LINE_ABS',
        source:      STATE.ACTIVE_START,
        destination: STATE.ACTIVE_LINE,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => intent.active.line = { kind: 'absolute', magnitude: token }
    },
    {
        id:          'ACTIVE_LINE_REL_MAG',
        source:      STATE.ACTIVE_LINE_SIGN_PREFIX,
        destination: STATE.ACTIVE_LINE,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => {
            switch (intent.active.line.kind) {
                case 'positiveRelative': 
                case 'negativeRelative': 
                    intent.active.line.magnitude += token;
                    break;
                default:
                    throw new Error('Unreachable!');
            }
        }
    },
    {
        id:          'ACTIVE_LINE_MAG',
        source:      STATE.ACTIVE_LINE,
        destination: STATE.ACTIVE_LINE,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => {
            switch (intent.active.line.kind) {
                case 'absolute':
                case 'positiveRelative': 
                case 'negativeRelative': 
                    intent.active.line.magnitude += token;       
                    break;
                default:
                    throw new Error('Unreachable!');
            }
        }
    },
    {
        id:          'ACTIVE_SEP_1',
        source:      STATE.ACTIVE_START,
        destination: STATE.ACTIVE_COORDINATE_SEPARATOR,
        condition:   TERMINAL.COORDINATE_SEPARATOR,
        callback:    () => {}
    },
    {
        id:          'ACTIVE_SEP_2',
        source:      STATE.ACTIVE_LINE,
        destination: STATE.ACTIVE_COORDINATE_SEPARATOR,
        condition:   TERMINAL.COORDINATE_SEPARATOR,
        callback:    () => {}
    },
    {
        id:          'ACTIVE_SHORT_1A',
        source:      STATE.ACTIVE_START,
        destination: STATE.ACTIVE_CHAR_SHORTCUT,
        condition:   TERMINAL.FIRST_NON_WHITESPACE_CHARACTER_SHORTCUT,
        callback:    (intent) => intent.active.character = { kind: 'firstNonWhitespaceCharacterShortcut' }
    },
    {
        id:          'ACTIVE_SHORT_1B',
        source:      STATE.ACTIVE_START,
        destination: STATE.ACTIVE_CHAR_SHORTCUT,
        condition:   TERMINAL.ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_SHORTCUT,
        callback:    (intent) => intent.active.character = { kind: 'onePastLastNonWhitespaceCharacterShortcut' }
    },
    {
        id:          'ACTIVE_SHORT_1C',
        source:      STATE.ACTIVE_START,
        destination: STATE.ACTIVE_CHAR_SHORTCUT,
        condition:   TERMINAL.START_OF_LINE_SHORTCUT,
        callback:    (intent) => intent.active.character = { kind: 'startOfLineShortcut' }
    },
    {
        id:          'ACTIVE_SHORT_1D',
        source:      STATE.ACTIVE_START,
        destination: STATE.ACTIVE_CHAR_SHORTCUT,
        condition:   TERMINAL.END_OF_LINE_SHORTCUT,
        callback:    (intent) => intent.active.character = { kind: 'endOfLineShortcut' }
    },
    {
        id:          'ACTIVE_SHORT_2A',
        source:      STATE.ACTIVE_LINE,
        destination: STATE.ACTIVE_CHAR_SHORTCUT,
        condition:   TERMINAL.FIRST_NON_WHITESPACE_CHARACTER_SHORTCUT,
        callback:    (intent) => intent.active.character = { kind: 'firstNonWhitespaceCharacterShortcut' }
    },
    {
        id:          'ACTIVE_SHORT_2B',
        source:      STATE.ACTIVE_LINE,
        destination: STATE.ACTIVE_CHAR_SHORTCUT,
        condition:   TERMINAL.ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_SHORTCUT,
        callback:    (intent) => intent.active.character = { kind: 'onePastLastNonWhitespaceCharacterShortcut' }
    },
    {
        id:          'ACTIVE_SHORT_2C',
        source:      STATE.ACTIVE_LINE,
        destination: STATE.ACTIVE_CHAR_SHORTCUT,
        condition:   TERMINAL.START_OF_LINE_SHORTCUT,
        callback:    (intent) => intent.active.character = { kind: 'startOfLineShortcut' }
    },
    {
        id:          'ACTIVE_SHORT_2D',
        source:      STATE.ACTIVE_LINE,
        destination: STATE.ACTIVE_CHAR_SHORTCUT,
        condition:   TERMINAL.END_OF_LINE_SHORTCUT,
        callback:    (intent) => intent.active.character = { kind: 'endOfLineShortcut' }
    },
    {
        id:          'ACTIVE_CHAR_REL_NEG',
        source:      STATE.ACTIVE_COORDINATE_SEPARATOR,
        destination: STATE.ACTIVE_CHAR_SIGN_PREFIX,
        condition:   TERMINAL.NEGATIVE_SIGN_PREFIX,
        callback:    (intent) => intent.active.character = { kind: 'negativeRelative', magnitude: '' }
    },
    {
        id:          'ACTIVE_CHAR_REL_POS',
        source:      STATE.ACTIVE_COORDINATE_SEPARATOR,
        destination: STATE.ACTIVE_CHAR_SIGN_PREFIX,
        condition:   TERMINAL.POSITIVE_SIGN_PREFIX,
        callback:    (intent) => intent.active.character = { kind: 'positiveRelative', magnitude: '' }
    },
    {
        id:          'ACTIVE_CHAR_ABS',
        source:      STATE.ACTIVE_COORDINATE_SEPARATOR,
        destination: STATE.ACTIVE_CHAR,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => intent.active.character = { kind: 'absolute', magnitude: token }
    },
    {
        id:          'ACTIVE_CHAR_REL_MAG',
        source:      STATE.ACTIVE_CHAR_SIGN_PREFIX,
        destination: STATE.ACTIVE_CHAR,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => {
            switch (intent.active.character.kind) {
                case 'positiveRelative': 
                case 'negativeRelative': 
                    intent.active.character.magnitude += token;
                    break;
                default:
                    throw new Error('Unreachable!');
            }
        }
    },
    {
        id:          'ACTIVE_CHAR_MAG',
        source:      STATE.ACTIVE_CHAR,
        destination: STATE.ACTIVE_CHAR,
        condition:   DIGIT_TERMINALS,
        callback:    (intent, token) => {
            switch (intent.active.character.kind) {
                case 'absolute':
                case 'positiveRelative': 
                case 'negativeRelative': 
                    intent.active.character.magnitude += token;       
                    break;
                default:
                    throw new Error('Unreachable!');
            }
        }
    }
];

/** 
 * Type of `Map` that contains all possible transitions out of a state. 
 * 
 * @key 
 * 
 * @value 
 * 
 * */
/** Type of a `Map` that maps each terminal to a destination. */
type OutMap = ;

// TODO: make this an ES6 Map type constructed from the Transition Graph
// TODO: explain this shit


/** 
 * The state map of the finite automation. 
 * 
 * We access the state map via the `get` method by providing a source state. This yields a 
 * `DestinationMap` type which maps each possible terminal from the source state to 
 * 
 * 
 * 
 * Accessing the state map gives us a `DESTINATION
 * 
 * 
 * 
 * State map that maps each state to a destination map. This destination map maps each terminal */
const STATE_MAP = new Map<
    STATE, 
    Map<TERMINAL, { destination: STATE, callback: (intent: Intent, token: string) => void }>
>;

//TODO: make sure that this checks and throws if there is more than one possible transition for a TERMINAL
for (const { source, destination, condition, callback } of TRANSITIONS) {
    if (STATE_MAP.has(source)) {
        STATE_MAP.get(source)




    } else {
        STATE_MAP.set(source, new Map());

    }



}

