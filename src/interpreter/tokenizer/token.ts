export type Token = 
    TokenNumber 
    | TokenMinus 
    | TokenCommaOrColon 
    | TokenPeriod 
    | TokenDoublePeriod 
    | TokenCapitalH 
    | TokenCapitalL 
    | TokenSmallH 
    | TokenSmallL
    | TokenEndOfInput;

    /** Sequence of digits. */
    interface TokenNumber {
        kind: 'number';
        // The value is stored as the string representation of the number. We only convert it to the
        // actual `number` type during parsing.
        valueStr: string;
    }
    /** Symbol: `-`. */
    interface TokenMinus {
        kind: 'minus';
    } 

    /** Symbol: `,` or `:`. */
    interface TokenCommaOrColon {
        kind: 'commaOrColon';
    } 

    /** Symbol: `.`. */
    interface TokenPeriod {
        kind: 'period';
    }

    /** Symbol: `..`. */
    interface TokenDoublePeriod {
        kind: 'doublePeriod';
    }

    /** Symbol: `H`. */
    interface TokenCapitalH {
        kind: 'H';
    } 

    /** Symbol: `L`. */
    interface TokenCapitalL {       
        kind: 'L';
    } 

    /** Symbol: `h`. */
    interface TokenSmallH {
        kind: 'h';
    }

    /** Symbol: `l`. */
    interface TokenSmallL {
        kind: 'l';
    }

    /** Special token used to mark the end of input. */
    interface TokenEndOfInput {
        kind: 'EOF';
    }

