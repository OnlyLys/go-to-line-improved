/** Represents the `TARGET` variable in the grammar. This is also the start variable. */
export type VarTarget = VarTargetStartWithOptionalRangeEnd | VarTargetRangeEndOnly;

    interface VarTargetStartWithOptionalRangeEnd {
        kind: 'startWithOptionalRangeEnd';
        start: VarPosition;
        end: VarRangeEnd | undefined;
    }

    interface VarTargetRangeEndOnly { 
        kind: 'rangeEndOnly';
        end: VarRangeEnd;
    }

/** Represents the `RANGE_END` variable in the grammar. */
export type VarRangeEnd = VarRangeEndPeriod | VarRangeEndDoublePeriod;

    interface VarRangeEndPeriod {
        kind: 'period';
        position: VarPosition;
    }

    interface VarRangeEndDoublePeriod {
        kind: 'doublePeriod';
        position: VarPosition;
    }

/** Represents the `POSITION` variable in the grammar. */
export type VarPosition = VarPositionLineWithOptionalColumn | VarPositionColumnOnly;

    interface VarPositionLineWithOptionalColumn {
        kind: 'lineWithOptionalColumn';
        line: VarLine;
        column: VarColumn | undefined;
    }

    interface VarPositionColumnOnly {
        kind: 'columnOnly';
        column: VarColumn;
    }
        
/** Represents the `LINE` variable in the grammar. */
export type VarLine = VarLineNumberOnly | VarLineMinusPrefix;

    interface VarLineNumberOnly {
        kind: 'numberOnly';
        value: number;
    }

    interface VarLineMinusPrefix {
        kind: 'minusPrefix';
        value: number;
    }

/** Represents the `COLUMN` varaible in the grammar. */
export type VarColumn = 
    VarColumnNumber 
    | VarColumnCapitalH 
    | VarColumnCapitalL 
    | VarColumnSmallH 
    | VarColumnSmallL;

    interface VarColumnNumber {
        kind: 'number';
        value: number;
    }

    interface VarColumnCapitalH {
        kind: 'H';
    }

    interface VarColumnCapitalL {
        kind: 'L';
    }

    interface VarColumnSmallH {
        kind: 'h';
    }

    interface VarColumnSmallL {
        kind: 'l';
    }
