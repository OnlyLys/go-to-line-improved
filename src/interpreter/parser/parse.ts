import { TokenStream } from '../tokenizer/token-stream';
import { VarColumn, VarLine, VarPosition, VarRangeEnd, VarTarget } from './var';
import { Result, andThen } from './result';

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
    const target = parseTarget(tokenStream);
    if (tokenStream.hasTokensRemaining() || target.kind === 'err') {
        return undefined;
    } else {
        return target.value;
    }
}

/** This parses the start `TARGET` variable. Thus `VarTarget` forms the root of our syntax tree. */
function parseTarget(tokenStream: TokenStream): Result<VarTarget> {
    switch (tokenStream.peek().kind) {
        // <TARGET> -> <POSITION><OPTIONAL_RANGE_END> 
        case 'number':
        case 'minus':
        case 'commaOrColon':
        case 'H':
        case 'L':
        case 'h':
        case 'l': {
            const start = parsePosition(tokenStream);
            const end = parseOptionalRangeEnd(tokenStream);
            if (start.kind === 'ok' && end.kind === 'ok') {
                return {
                    kind: 'ok', 
                    value: { kind: 'startWithOptionalRangeEnd', start: start.value, end: end.value }
                };
            } else {
                return { kind: 'err' };
            }
        }
        // <TARGET> -> <RANGE_END>
        case 'period':
        case 'doublePeriod': {
            return andThen(
                parseRangeEnd(tokenStream),
                end => { return { kind: 'rangeEndOnly', end }; }
            );
        }
        default: {
            return { kind: 'err' };
        }
    }
}

/** Returns `undefined` if no range end was specified in the input. */
function parseOptionalRangeEnd(tokenStream: TokenStream): Result<VarRangeEnd | undefined> {
    switch (tokenStream.peek().kind) {
        // FIRST: <OPTIONAL_RANGE_END> -> <RANGE_END>
        case 'period':
        case 'doublePeriod': {
            return andThen(
                parseRangeEnd(tokenStream), 
                rangeEnd => rangeEnd
            );
        }
        // FOLLOW: <OPTIONAL_RANGE_END> -> Ɛ
        case 'EOF': {
            return { kind: 'ok', value: undefined };
        }
        default: {
            return { kind: 'err' };
        }
    }
}

function parseRangeEnd(tokenStream: TokenStream): Result<VarRangeEnd> {
    switch (tokenStream.peek().kind) {
        // <RANGE_END> -> /\./<POSITION>
        case 'period': {
            tokenStream.advance();
            return andThen(
                parsePosition(tokenStream),
                position => { return { kind: 'period', position }; }
            );
        }
        // <RANGE_END> -> /\.\./<POSITION>
        case 'doublePeriod': {
            tokenStream.advance();
            return andThen(
                parsePosition(tokenStream),
                position => { return { kind: 'doublePeriod', position }; }
            );
        }
        default: {
            return { kind: 'err' };
        }
    }
}

function parsePosition(tokenStream: TokenStream): Result<VarPosition> {
    switch (tokenStream.peek().kind) {
        // <POSITION> -> <LINE><OPTIONAL_COLUMN>
        case 'number':
        case 'minus': {
            const line = parseLine(tokenStream);
            const column = parseOptionalColumn(tokenStream);
            if (line.kind === 'ok' && column.kind === 'ok') {
                return { 
                    kind: 'ok', 
                    value: { kind: 'lineWithOptionalColumn', line: line.value, column: column.value }
                };
            } else {
                return { kind: 'err' };
            }
        }
        // <POSITION> -> <COLUMN>
        case 'commaOrColon':
        case 'H':
        case 'L': 
        case 'h':
        case 'l': {
            return andThen(
                parseColumn(tokenStream),
                column => { return { kind: 'columnOnly', column }; }
            );
        }
        default: {
            return { kind: 'err' };
        }
    }
}

function parseLine(tokenStream: TokenStream): Result<VarLine> {
    switch (tokenStream.peek().kind) {
        // <LINE> -> /[0-9]+/
        case 'number': {
            return andThen(
                parseNumberToken(tokenStream),
                value => { return { kind: 'numberOnly', value }; }
            );
        }
        // <LINE> -> /-//[0-9]+/
        case 'minus': {
            tokenStream.advance();
            return andThen(
                parseNumberToken(tokenStream),
                value => { return { kind: 'minusPrefix', value }; }
            );
        }
        default: {
            return { kind: 'err' };
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
            return andThen(
                parseColumn(tokenStream), 
                column => column
            );
        }
        // FOLLOW: <OPTIONAL_COLUMN> -> Ɛ
        case 'period':
        case 'doublePeriod': 
        case 'EOF' : {
            return { kind: 'ok', value: undefined };
        }
        default: {
            return { kind: 'err' };
        }
    }
}

function parseColumn(tokenStream: TokenStream): Result<VarColumn> {
    switch (tokenStream.peek().kind) {
        // <COLUMN> -> /(,|:)//[0-9]+/
        case 'commaOrColon': {
            tokenStream.advance();
            return andThen(
                parseNumberToken(tokenStream), 
                value => { return { kind: 'number', value }; }
            );
        }
        // <COLUMN> -> /H/
        case 'H': {
            tokenStream.advance();
            return { kind: 'ok', value: { kind: 'H' } };
        }
        // <COLUMN> -> /L/
        case 'L': {
            tokenStream.advance();
            return { kind: 'ok', value: { kind: 'L' } };
        }
        // <COLUMN> -> /h/
        case 'h': {
            tokenStream.advance();
            return { kind: 'ok', value: { kind: 'h' } };
        }
        // <COLUMN> -> /l/
        case 'l': {
            tokenStream.advance();
            return { kind: 'ok', value: { kind: 'l' } };
        }
        default: {
            return { kind: 'err' };
        }
    }
}

function parseNumberToken(tokenStream: TokenStream): Result<number> {
    const lookahead = tokenStream.peek();
    if (lookahead.kind === 'number') {
        tokenStream.advance();
        return { kind: 'ok', value: Number.parseInt(lookahead.valueStr) };
    } else {
        return { kind: 'err' };
    }
}
