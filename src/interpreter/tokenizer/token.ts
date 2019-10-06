export type Token = 
    TokenNumber 
    | TokenNegativeNumber
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
        magnitude: number;
    }

    /** Sequence of digits with a `-` prefix. */
    interface TokenNegativeNumber {
        kind: 'negativeNumber';
        magnitude: number;
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

