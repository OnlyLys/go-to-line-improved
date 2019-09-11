/* All the terminal symbols for the input grammar are contained here. */
export enum TERMINAL {

    /** Specifies the two coordinates in a normal selection command. */
    SELECT_SEPARATOR = ':',

    /** Separates the two coordinates in an quick selection command. */
    QUICK_SELECT_SEPARATOR = ',',

    /** Separates the line term from the number term in a coordinate. */
    COORDINATE_SEPARATOR = ',',

    /** Plus sign to prefix a positive relative term. */
    POSITIVE_SIGN_PREFIX = '+',

    /** Minus sign to prefix a negative relative term. */
    NEGATIVE_SIGN_PREFIX = '-',

    /** Shortcut to start of line. */
    START_OF_LINE_SHORTCUT = 'H',

    /** Shortcut to end of line. */
    END_OF_LINE_SHORTCUT = 'L',

    /** Shortcut to first non-whitespace character of line. */
    FIRST_NON_WHITESPACE_CHARACTER_SHORTCUT = 'h',

    /** Shortcut to one character past last non-whitespace character of line. */
    ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_SHORTCUT = 'l',

    ZERO = '0',

    ONE = '1',

    TWO = '2',

    THREE = '3',

    FOUR = '4',

    FIVE = '5',

    SIX = '6',

    SEVEN = '7',

    EIGHT = '8',

    NINE = '9',

}