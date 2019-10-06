import { TokenStream } from '../tokenizer/token-stream';
import { VarColumn, VarLine, VarPosition, VarRangeEnd, VarTarget } from './var';
import { Result, Err, Ok } from './result';

//! Our parsing strategy is top-down recursive descent with 1 token of lookahead. 

/** 
 * Parse a token stream into an `VarTarget`, which is a syntax tree containing all the information 
 * obtained from the user input. This syntax tree represents the start variable `TARGET` of the 
 * grammar, and contains information about the selection / 'go to' operation specified by the input.
 * 
 * `undefined` will be returned if there is a syntax error. Note that an empty input (and thus empty
 * `TokenStream`) is also considered a syntax error.
 */ 
export function parse(tokenStream: TokenStream): VarTarget | undefined {
    const targetResult = parseTarget(tokenStream);
    if (tokenStream.hasTokensRemaining() || !targetResult.ok) {
        return undefined;
    } else {
        return targetResult.value;
    }
}

/** This parses the start `TARGET` variable. Thus `VarTarget` forms the root of our syntax tree. */
function parseTarget(tokenStream: TokenStream): Result<VarTarget> {
    switch (tokenStream.peek().kind) {
        // <TARGET> -> <POSITION><OPTIONAL_RANGE_END> 
        case 'number':
        case 'negativeNumber':
        case 'commaOrColon':
        case 'H':
        case 'L':
        case 'h':
        case 'l': {
            const start = parsePosition(tokenStream);
            if (start.ok) {
                const end = parseOptionalRangeEnd(tokenStream);
                if (end.ok) {
                    return Ok({ 
                        kind: 'startWithOptionalRangeEnd', 
                        start: start.value, 
                        end: end.value 
                    });
                }
            } 
            return Err();
        }
        // <TARGET> -> <RANGE_END>
        case 'period':
        case 'doublePeriod': {
            return parseRangeEnd(tokenStream)
                .andThen(varRangeEnd => { return { kind: 'rangeEndOnly', end: varRangeEnd }; });
        }
        default: {
            return Err();
        }
    }
}

/** Returns `undefined` if no range end was specified in the input. */
function parseOptionalRangeEnd(tokenStream: TokenStream): Result<VarRangeEnd | undefined> {
    switch (tokenStream.peek().kind) {
        // FIRST: <OPTIONAL_RANGE_END> -> <RANGE_END>
        case 'period':
        case 'doublePeriod': {
            return parseRangeEnd(tokenStream);
        }
        // FOLLOW: <OPTIONAL_RANGE_END> -> Ɛ
        case 'EOF': {
            return Ok(undefined);
        }
        default: {
            return Err();
        }
    }
}

function parseRangeEnd(tokenStream: TokenStream): Result<VarRangeEnd> {
    switch (tokenStream.pop().kind) {
        // <RANGE_END> -> /\./<POSITION>
        case 'period': {
            return parsePosition(tokenStream)
                .andThen(positionVar => { return { kind: 'period', position: positionVar }; });
        }
        // <RANGE_END> -> /\.\./<POSITION>
        case 'doublePeriod': {
            return parsePosition(tokenStream)
                .andThen(positionVar => { return { kind: 'doublePeriod', position: positionVar }; });
        }
        default: {
            return Err();
        }
    }
}

function parsePosition(tokenStream: TokenStream): Result<VarPosition> {
    switch (tokenStream.peek().kind) {
        // <POSITION> -> <LINE><OPTIONAL_COLUMN>
        case 'number':
        case 'negativeNumber': {
            const lineResult = parseLine(tokenStream);
            if (lineResult.ok) {
                const columnResult = parseOptionalColumn(tokenStream);
                if (columnResult.ok) {
                    return Ok({ 
                        kind: 'lineWithOptionalColumn', 
                        line: lineResult.value, 
                        column: columnResult.value 
                    });
                }
            }
            return Err();
        }
        // <POSITION> -> <COLUMN>
        case 'commaOrColon':
        case 'H':
        case 'L': 
        case 'h':
        case 'l': {
            return parseColumn(tokenStream)
                .andThen(varColumn => { return { kind: 'columnOnly', column: varColumn }; });
        }
        default: {
            return Err();
        }
    }
}

function parseLine(tokenStream: TokenStream): Result<VarLine> {
    const next = tokenStream.pop();
    switch (next.kind) {
        // <LINE> -> /[0-9]+/
        case 'number': {
            return Ok({ kind: 'number', value: next.magnitude });
        }
        // <LINE> -> /-[0-9]+/
        case 'negativeNumber': {
            return Ok({ kind: 'negativeNumber', value: next.magnitude });
        }
        default: {
            return Err();
        }
    }
}

/** Returns `undefined` if there no column value was specified in the input. */
function parseOptionalColumn(tokenStream: TokenStream): Result<VarColumn | undefined> {
    switch (tokenStream.peek().kind) {
        // FIRST: <OPTIONAL_COLUMN> -> <COLUMN>
        case 'commaOrColon': 
        case 'H': 
        case 'L':
        case 'h':
        case 'l': {
            return parseColumn(tokenStream);
        }
        // FOLLOW: <OPTIONAL_COLUMN> -> Ɛ
        case 'period':
        case 'doublePeriod': 
        case 'EOF' : {
            return Ok(undefined);
        }
        default: {
            return Err();
        }
    }
}

function parseColumn(tokenStream: TokenStream): Result<VarColumn> {
    switch (tokenStream.pop().kind) {
        // <COLUMN> -> /(,|:)//[0-9]+/
        case 'commaOrColon': {
            const next = tokenStream.pop();
            switch (next.kind) {
                case 'number': 
                    return Ok({ kind: 'number', value: next.magnitude });
                default: 
                    return Err();
            }
        }
        // <COLUMN> -> /H/
        case 'H': {
            return Ok({ kind: 'H'});
        }
        // <COLUMN> -> /L/
        case 'L': {
            return Ok({ kind: 'L'});
        }
        // <COLUMN> -> /h/
        case 'h': {
            return Ok({ kind: 'h'});
        }
        // <COLUMN> -> /l/
        case 'l': {
            return Ok({ kind: 'l'});
        }
        default: {
            return Err();
        }
    }
}