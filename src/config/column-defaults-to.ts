/** What the column number defaults to if it is not specified in the input. */
export enum COLUMN_DEFAULTS_TO {    
    START_OF_LINE = 'startOfLine',
    END_OF_LINE = 'endOfLine',
    FIRST_NON_WHITESPACE_CHARACTER_OF_LINE = 'firstNonWhitespaceCharacterOfLine',
    ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_OF_LINE = 'onePastLastNonWhitespaceCharacterOfLine'
}