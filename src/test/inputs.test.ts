import { Input, getQuickSelectionOneBased, SelectionOneBased } from "./test-utilities.test";

/**
 * Go To Test Inputs
 * 
 * These are input strings and expected `Selection` output from the parser for `Go To` commands, 
 * which specify one location in the document to move the cursor to.
 * 
 * Some things to note:
 * - The primary cursor has an initial `anchor` position of 50,50 (in 1-based numbers).
 * - Any tests where the character number is not specified in the input expects a default behavior 
 * that places the cursor horizontally at the first non-whitespace character.
 * - Any tests where the line number is not specified in the input expects the line number not to
 * change.
 * - 'Out of Bounds' tests are tests which purposefully input a location that outside the range of 
 * the document. We expect automatic bounds limiting to kick in to set the value to the nearest 
 * extreme value.
 * - These inputs can immediately be used to test 'Go To' commands or combined to test the various
 * selection commands.
*/
export const goToTestInputs: Input[] = [
    // Absolute line
    { str: '1',                expect: [1, 5, 1, 5]       },
    { str: '22',               expect: [22, 1, 22, 1]     },
    { str: '50',               expect: [50, 1, 50, 1]     },
    { str: '68',               expect: [68, 1, 68, 1]     },
    { str: '97',               expect: [97, 29, 97, 29]   },
    { str: '100',              expect: [100, 5, 100, 5]   },
    // Absolute line out of bounds
    { str: '0',                expect: [1, 5, 1, 5]       },
    { str: '101',              expect: [100, 5, 100, 5]   },
    { str: '1000',             expect: [100, 5, 100, 5]   },
    { str: '10000',            expect: [100, 5, 100, 5]   },
    { str: '100000',           expect: [100, 5, 100, 5]   },
    { str: '43859039',         expect: [100, 5, 100, 5]   },
    // Relative line
    { str: '-0',               expect: [50, 1, 50, 1]     },
    { str: '+0',               expect: [50, 1, 50, 1]     },
    { str: '-10',              expect: [40, 13, 40, 13]   },
    { str: '+10',              expect: [60, 5, 60, 5]     },
    { str: '-49',              expect: [1, 5, 1, 5]       },
    { str: '+50',              expect: [100, 5, 100, 5]   },
    // Relative line out of bounds
    { str: '-51',              expect: [1, 5, 1, 5]       },
    { str: '+51',              expect: [100, 5, 100, 5]   },
    { str: '-100',             expect: [1, 5, 1, 5]       },
    { str: '+100',             expect: [100, 5, 100, 5]   },
    { str: '-1000',            expect: [1, 5, 1, 5]       },
    { str: '+1000',            expect: [100, 5, 100, 5]   },
    // Absolute char
    { str: ',1',               expect: [50, 1, 50, 1]     },
    { str: ',25',              expect: [50, 25, 50, 25]   },
    { str: ',50',              expect: [50, 50, 50, 50]   },
    { str: ',75',              expect: [50, 75, 50, 75]   },
    { str: ',100',             expect: [50, 100, 50, 100] },
    { str: ',102',             expect: [50, 102, 50, 102] },
    // Absolute char out of bounds
    { str: ',0',               expect: [50, 1, 50, 1]     },
    { str: ',103',             expect: [50, 102, 50, 102] },
    { str: ',1000',            expect: [50, 102, 50, 102] },
    { str: ',10000',           expect: [50, 102, 50, 102] },
    { str: ',100000',          expect: [50, 102, 50, 102] },
    { str: ',38349905',        expect: [50, 102, 50, 102] },
    // Relative char
    { str: ',-0',              expect: [50, 50, 50, 50]   },
    { str: ',+0',              expect: [50, 50, 50, 50]   },
    { str: ',-25',             expect: [50, 25, 50, 25]   },
    { str: ',+25',             expect: [50, 75, 50, 75]   },
    { str: ',-49',             expect: [50, 1, 50, 1]     },
    { str: ',+52',             expect: [50, 102, 50, 102] },
    // Relative char out of bounds
    { str: ',-50',             expect: [50, 1, 50, 1]     },
    { str: ',+53',             expect: [50, 102, 50, 102] },
    { str: ',-100',            expect: [50, 1, 50, 1]     },
    { str: ',+100',            expect: [50, 102, 50, 102] },
    { str: ',-1000',           expect: [50, 1, 50, 1]     },
    { str: ',+1000',           expect: [50, 102, 50, 102] },
    // Absolute line + Absolute char
    { str: '1,1',              expect: [1, 1, 1, 1]       },
    { str: '20,20',            expect: [20, 20, 20, 20]   },
    { str: '50,50',            expect: [50, 50, 50, 50]   },
    { str: '67,135',           expect: [67, 135, 67, 135] },
    { str: '92,9',             expect: [92, 9, 92, 9]     },
    { str: '100,23',           expect: [100, 23, 100, 23] },
    // Absolute line + Absolute char; Line out of bounds
    { str: '0,8',              expect: [1, 8, 1, 8]       },
    { str: '101,12',           expect: [100, 12, 100, 12] },
    { str: '200,15',           expect: [100, 15, 100, 15] },
    { str: '1000,1',           expect: [100, 1, 100, 1]   },
    { str: '10000,23',         expect: [100, 23, 100, 23] },
    { str: '1000000,10',       expect: [100, 10, 100, 10] },
    // Absolute line + Absolute char; Char out of bounds
    { str: '1,100',            expect: [1, 89, 1, 89]     },
    { str: '45,10000',         expect: [45, 106, 45, 106] },
    { str: '50,0',             expect: [50, 1, 50, 1]     },
    { str: '50,103',           expect: [50, 102, 50, 102] },
    { str: '75, 200',          expect: [75, 5, 75, 5]     },
    { str: '100,24',           expect: [100, 23, 100, 23] },
    // Absolute line + Absolute char; Both out of bounds
    { str: '0,0',              expect: [1, 1, 1, 1]       },
    { str: '0,90',             expect: [1, 89, 1, 89]     },
    { str: '101,0',            expect: [100, 1, 100, 1]   },
    { str: '101,24',           expect: [100, 23, 100, 23] },
    { str: '1000,1000',        expect: [100, 23, 100, 23] },
    { str: '10000,10000',      expect: [100, 23, 100, 23] },
    // Absolute line + Relative char
    { str: '1,-49',            expect: [1, 1, 1, 1]       },
    { str: '1,+39',            expect: [1, 89, 1, 89]     },
    { str: '50,-0',            expect: [50, 50, 50, 50]   },
    { str: '50,+0',            expect: [50, 50, 50, 50]   },
    { str: '100,-40',          expect: [100, 10, 100, 10] },
    { str: '100,-30',          expect: [100, 20, 100, 20] },
    // Absolute line + Relative char; Line out of bounds
    { str: '0,+0',             expect: [1, 50, 1, 50]     },
    { str: '0,+10',            expect: [1, 60, 1, 60]     },
    { str: '0,-49',            expect: [1, 1, 1, 1]       },
    { str: '101,-49',          expect: [100, 1, 100, 1]   },
    { str: '1000,-30',         expect: [100, 20, 100, 20] },
    { str: '48905,-40',        expect: [100, 10, 100, 10] },
    // Absolute line + Relative char; Char out of bounds
    { str: '1,-50',            expect: [1, 1, 1, 1]       },
    { str: '1,+40',            expect: [1, 89, 1, 89]     },
    { str: '50,-1000',         expect: [50, 1, 50, 1]     },
    { str: '50,+1000',         expect: [50, 102, 50, 102] },
    { str: '100,-100',         expect: [100, 1, 100, 1]   },
    { str: '100,+0',           expect: [100, 23, 100, 23] },
    // Absolute line + Relative char; Both out of bounds
    { str: '0,-50',            expect: [1, 1, 1, 1]       },
    { str: '0,+40',            expect: [1, 89, 1, 89]     },
    { str: '101,-50',          expect: [100, 1, 100, 1]   },
    { str: '101,-26',          expect: [100, 23, 100, 23] },
    { str: '444,-444',         expect: [100, 1, 100, 1]   },
    { str: '9348,+2485',       expect: [100, 23, 100, 23] },
    // Relative line + Absolute char
    { str: '-0,25',            expect: [50, 25, 50, 25]   },
    { str: '+25,2',            expect: [75, 2, 75, 2]     },
    { str: '-49,1',            expect: [1, 1, 1, 1]       },
    { str: '+50,1',            expect: [100, 1, 100, 1]   },
    { str: '-49,89',           expect: [1, 89, 1, 89]     },
    { str: '+50,23',           expect: [100, 23, 100, 23] },
    // Relative line + Absolute char; Line out of bounds
    { str: '-50,50',           expect: [1, 50, 1, 50]     },
    { str: '+51,23',           expect: [100, 23, 100, 23] },
    { str: '-100,89',          expect: [1, 89, 1, 89]     },
    { str: '+100,1',           expect: [100, 1, 100, 1]   },
    { str: '-1000,10',         expect: [1, 10, 1, 10]     },
    { str: '+1000,10',         expect: [100, 10, 100, 10] },
    // Relative line + Absolute char; Char out of bounds
    { str: '-30,10000',        expect: [20, 120, 20, 120] },
    { str: '+0,0',             expect: [50, 1, 50, 1]     },
    { str: '-49,0',            expect: [1, 1, 1, 1]       },
    { str: '-49,90',           expect: [1, 89, 1, 89]     },
    { str: '+50,0',            expect: [100, 1, 100, 1]   },
    { str: '+50,100',          expect: [100, 23, 100, 23] },
    // Relative line + Absolute char; Both out of bounds
    { str: '-50,90',           expect: [1, 89, 1, 89]     },
    { str: '+51,0',            expect: [100, 1, 100, 1]   },
    { str: '-60,10000',        expect: [1, 89, 1, 89]     },
    { str: '+60,10000',        expect: [100, 23, 100, 23] },
    { str: '-823094,90283490', expect: [1, 89, 1, 89]     },
    { str: '+823094,0',        expect: [100, 1, 100, 1]   },
    // Relative line + Relative char
    { str: '-0,+0',            expect: [50, 50, 50, 50]   },
    { str: '+0,+52',           expect: [50, 102, 50, 102] },
    { str: '-25,-25',          expect: [25, 25, 25, 25 ]  },
    { str: '+30,+30',          expect: [80, 80, 80, 80]   },
    { str: '-49,+39',          expect: [1, 89, 1, 89]     },
    { str: '+50,-45',          expect: [100, 5, 100, 5]   },
    // Relative line + Relative char; Line out of bounds
    { str: '-50,+10',          expect: [1, 60, 1, 60]     },
    { str: '+51,-30',          expect: [100, 20, 100, 20] },
    { str: '-1234,+39',        expect: [1, 89, 1, 89]     },
    { str: '+1234,-27',        expect: [100, 23, 100, 23] },
    { str: '-12345,-0',        expect: [1, 50, 1, 50]     },
    { str: '+12345,-45',       expect: [100, 5, 100, 5]   },
    // Relative line + Relative char; Char out of bounds
    { str: '-0,-100',          expect: [50, 1, 50, 1]     },
    { str: '+0,+100',          expect: [50, 102, 50, 102] },
    { str: '-5,-51',           expect: [45, 1, 45, 1]     },
    { str: '+5,+74',           expect: [55, 123, 55, 123] },
    { str: '-49,+100',         expect: [1, 89, 1, 89]     },
    { str: '+50,+100',         expect: [100, 23, 100, 23] },
    // Relative line + Relative char; Both out of bounds
    { str: '-50,+40',          expect: [1, 89, 1, 89]     },
    { str: '+50,-26',          expect: [100, 23, 100, 23] },
    { str: '-100,-100',        expect: [1, 1, 1, 1]       },
    { str: '+100,+100',        expect: [100, 23, 100, 23] },
    { str: '-1000,+1000',      expect: [1, 89, 1, 89]     },
    { str: '+1000,+1000',      expect: [100, 23, 100, 23] },
    // 'h' - First non-whitespace character of line shortcut
    { str: '1h',               expect: [1, 5, 1, 5]       },
    { str: '20h',              expect: [20, 17, 20, 17]   },
    { str: '50h',              expect: [50, 1, 50, 1]     },
    { str: '58h',              expect: [58, 1, 58, 1]     },
    { str: '70h',              expect: [70, 5, 70, 5]     },
    { str: '100h',             expect: [100, 5, 100, 5]   },
    // 'l' - One past last non-whitespace character of line shortcut
    { str: '1l',               expect: [1, 89, 1, 89]     },
    { str: '20l',              expect: [20, 119, 20, 119] },
    { str: '50l',              expect: [50, 101, 50, 101] },
    { str: '58l',              expect: [58, 1, 58, 1]     },
    { str: '70l',              expect: [70, 103, 70, 103] },
    { str: '100l',             expect: [100, 23, 100, 23] },
    // 'H' - Start of line shortcut
    { str: '1H',               expect: [1, 1, 1, 1]       },
    { str: '20H',              expect: [20, 1, 20, 1]     },
    { str: '50H',              expect: [50, 1, 50, 1]     },
    { str: '58H',              expect: [58, 1, 58, 1]     },
    { str: '70H',              expect: [70, 1, 70, 1]     },
    { str: '100H',             expect: [100, 1, 100, 1]   },
    // 'L' - End of line shortcut
    { str: '1L',               expect: [1, 89, 1, 89]     },
    { str: '20L',              expect: [20, 120, 20, 120] },
    { str: '50L',              expect: [50, 102, 50, 102] },
    { str: '58L',              expect: [58, 5, 58, 5]     },
    { str: '70L',              expect: [70, 104, 70, 104] },
    { str: '100L',             expect: [100, 23, 100, 23] },
];

/** 
 * Selection Test Inputs
 * 
 * These test input strings that select between two locations within the document. 
 * 
 * To create these tests, we use a simple method of taking each input string from the Go To Test 
 * Inputs above and constructing a longer input by joining it with another input string. The expected 
 * selection will then be a selection from the first input string's location to the second input 
 * string's location.
 */
export const selectionTestInputs: Input[] = crossMap<Input, Input>(goToTestInputs, 
    ({ str: str1, expect: expect1 }, { str: str2, expect: expect2 }) => {
        if (!expect1 || !expect2) {
            throw new Error('Error: Cannot Use Expected Bad Inputs To Perform Selection Tests!');
        }
        return { 
            str: `${str1}:${str2}`, 
            expect: [expect1[0], expect1[1], expect2[0], expect2[1]] 
        };
    }
);

/**
 * Selection From Cursor Test Inputs
 * 
 * This is similar to that of 'Selection Test Inputs', but the anchor of the expected selection will
 * always be that of the inital cursor (which is 50, 50 in 1-based numbers).
 */
export const selectionFromCursorTestInputs: Input[] = goToTestInputs.map(
    ({ str, expect }) => {
        if (!expect) {
            throw new Error('Error: Cannot Use Expected Bad Inputs To Perform Selection From Cursor Tests!');
        }   
        return { 
            str: `:${str}`, 
            expect: [50, 50, expect[0], expect[1]] as SelectionOneBased
        };
    }
);

/** 
 * Quick Selection Test Inputs
 * 
 * This is similar to 'Selection Test Inputs', however the selection is of a 'Quick Select' kind
 * which involves expanding the selection to completely cover the lines that the selection's `active` 
 * and `anchor` is on.
 */
export const quickSelectionTestInputs: Input[] = crossMap<Input, Input>(goToTestInputs,
    ({ str: str1, expect: expect1 }, { str: str2, expect: expect2 }) => {
        if (!expect1 || !expect2) {
            throw new Error('Error: Cannot Use Expected Bad Inputs To Perform Quick Selection Tests!');
        }
        return {
            str: `${str1};${str2}`,
            expect: getQuickSelectionOneBased([expect1[0], expect1[1], expect2[0], expect2[1]])
        };
    }
);

/** 
 * Quick Selection Test Inputs
 * 
 * This is similar to 'Quick Selection Test Inputs', however the `anchor` before expansion is always
 * the primary cursor's anchor.
 */
export const quickSelectionFromCursorTestInputs = goToTestInputs.map(
    ({ str, expect }) => {
        if (!expect) {
            throw new Error('Error: Cannot Use Expected Bad Inputs To Perform Quick Selection From Cursor Tests!');
        }   
        return {
            str: `;${str}`,
            expect: getQuickSelectionOneBased([50, 50, expect[0], expect[1]])
        };
    }
);

// ------------------------------------------------------------------
// Whitespace Ignore Tests
//
// The following tests check that all whitespace is ignored by the parser. The easiest (and lazy) 
// way to do this would be to take the above 5 tests:
// - Go To
// - Selection
// - Selection From Cursor
// - Quick Selection
// - Quick Selection From Cursor
// And then just injecting random amounts of whitespace between characters in each string
export const whitespaceIgnoreTestInputs: Input[] = goToTestInputs.concat(
        selectionTestInputs,
        selectionFromCursorTestInputs,
        quickSelectionTestInputs,
        quickSelectionFromCursorTestInputs
    ).map(({ str, expect }) => { return { str: injectRandomWhitespace(str), expect }; });

// ------------------------------------------------------------------
// Known Bad Inputs
//
// The following are known bad inputs where we require the parser to ignore all of them. Of course,
// such tests are unable to be exhaustive but can be added to over time.
export const knownBadTestInputs: Input[] = [
    // Empty input or just whitespace
    { str: '', expect: undefined },
    { str: ' ', expect: undefined },
    { str: '  ', expect: undefined },
    { str: '   ', expect: undefined },
    { str: '    ', expect: undefined },
    { str: '     ', expect: undefined },
    // Junk input
    { str: 'jklsdf', expect: undefined },
    { str: '..1', expect: undefined },
    { str: '14i', expect: undefined },
    { str: 'please-reject-me', expect: undefined },
    { str: 'random', expect: undefined },
    { str: '$', expect: undefined },
    // Plain symbols
    { str: '+', expect: undefined },
    { str: '-', expect: undefined },
    { str: ':', expect: undefined },
    { str: ';', expect: undefined },
    // Sign mixtures
    { str: '-+', expect: undefined },
    { str: '+-', expect: undefined },

    // Repated signs
    { str: '++5', expect: undefined },
    { str: '--5', expect: undefined },

    { str: '++++', expect: undefined },
    { str: '----', expect: undefined },
    // Signs following numbers instead of numbers following signs
    { str: '5+', expect: undefined },
    { str: '5,5-', expect: undefined },
    { str: '5+:5', expect: undefined },
    { str: ':5+,5+', expect: undefined },
    { str: '5,5-;5,5', expect: undefined },
    { str: '5,5:5-,5', expect: undefined },
    // Repeated signs following numbers

    // Plain comma (plain coordinate separator)
    { str: ',', expect: undefined },
    { str: ',,', expect: undefined },
    { str: ',,,', expect: undefined },
    { str: ',,,,', expect: undefined },
    { str: ',,,,,', expect: undefined },
    { str: ',,,,,,', expect: undefined },
    // Plain colon (plain selection separator)
    { str: ':', expect: undefined },
    { str: '::', expect: undefined },
    { str: ':::', expect: undefined },
    { str: '::::', expect: undefined },
    { str: ':::::', expect: undefined },
    { str: '::::::', expect: undefined },
    // Plain semicolon (plain quick select separator)

    // Repeated colon separators
    { str: '5::5', expect: undefined },
    { str: '5:::5', expect: undefined },
    { str: '5::::5', expect: undefined },
    { str: '5:::::5', expect: undefined },
    { str: '5::::::5', expect: undefined },
    { str: '5:::::::5', expect: undefined },
    // Repeated commas
    { str: '5,,5', expect: undefined },

    // Repeated
    { str: '5;;;5', expect: undefined },
    // { str: ',5;'}

    // Repeated colons

    // Repeated semicolons

    // Multiple signs

    // Ending with separators
    { str: '5,', expect: undefined },
    { str: '5:', expect: undefined },
    { str: ':5,', expect: undefined },
    { str: ',5;', expect: undefined },
    { str: '5,5:', expect: undefined },
    { str: '5,5;5,', expect: undefined },

    // Sign mix ups

    // 












];


// tentative rejections
// 
// +,
// ,-
// +,+
// ,+
// -:,

/** Get the cross product of an iterable with itself. Then transform each tuple value. */
function crossMap<T, U>(t: Iterable<T>, transform: (t1: T, t2: T) => U): U[] {
    const result: U[] = [];
    for (const t1 of t) {
        for (const t2 of t) {
            result.push(transform(t1, t2));
        }
    }
    return result;
}

/** 
 * Inject whitespace between each character in a string. The number of spaces injected is 
 * uniformly randomized between 1 and 10 spaces long.
 */
function injectRandomWhitespace(str: string): string {
    let result: string = getWhitespaces();
    for (const char of str) {
        result += char;
        result += getWhitespaces();
    }
    return result;

    /** Get whitespace that has a random uniform distribution between 1 and 10 spaces long. */
    function getWhitespaces(): string {
        let whitespaces: string = ' ';
        for (let i = 0; i < Math.floor(Math.random() * 10); ++i) {
            whitespaces += ' ';
        }
        return whitespaces;
    }
}