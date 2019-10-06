import { Token } from './token';
import { TokenStream } from './token-stream';

/** 
 * A token stream of the input string is returned if all the characters in it are valid. Otherwise
 * `undefined` is returned.
 */
export function tokenize(input: string): TokenStream | undefined {
    const tokens: Token[] = [];
    for (let i = 0; i < input.length; ++i) {
        // Skip whitespace.
        if (input[i].trim() === '') {
            continue;
        }
        if (isDigit(input[i])) {
            let magnitude = toDigit(input[i]) as number;
            // Consume until the end of the number.
            while (i + 1 < input.length && isDigit(input[i + 1])) {
                magnitude = (magnitude * 10) + ++i;
            }
            tokens.push({ kind: 'number', magnitude });
        } 
        else if (input[i] === '-' && i + 1 < input.length && isDigit(input[i + 1])) {
            // Increment `i` to skip the `-` sign.
            let magnitude = toDigit(input[++i]) as number;
            // Consume the number following the `-` sign.
            while (i + 1 < input.length && isDigit(input[i + 1])) {
                magnitude = (magnitude * 10) + ++i;
            }
            tokens.push({ kind: 'negativeNumber', magnitude });
        } 
        else if (input[i] === ',' || input[i] === ':') {
            tokens.push({ kind: 'commaOrColon' });
        } 
        else if (input[i] === '.') {
            // Lookahead by 1 character to decide whether the `.` or `..` operator is being used. 
            if (i + 1 < input.length && input[i + 1] === '.') {
                tokens.push({ kind: 'doublePeriod' });
                ++i;
            } else {
                tokens.push({ kind: 'period' });
            }
        } 
        else if (input[i] === 'H') {
            tokens.push({ kind: 'H' });
        } 
        else if (input[i] === 'L') {
            tokens.push({ kind: 'L' });
        } 
        else if (input[i] === 'h') {
            tokens.push({ kind: 'h' });
        } 
        else if (input[i] === 'l') {
            tokens.push({ kind: 'l' });
        } 
        else {
            return undefined;
        }
    }
    return new TokenStream(tokens);
}

function isDigit(char: string): boolean {
    switch (char) {
        case '0': case '1': case '2': case '3': case '4': 
        case '5': case '6': case '7': case '8': case '9': 
            return true;
        default:
            return false;
    }
}

function toDigit(char: string): number | undefined {
    switch (char) {
        case '0': 
            return 0;
        case '1': 
            return 1;
        case '2': 
            return 2;
        case '3': 
            return 3;
        case '4': 
            return 4;
        case '5': 
            return 5;
        case '6': 
            return 6;
        case '7': 
            return 7;
        case '8': 
            return 8;
        case '9':
            return 9;
        default:
            return undefined;
    }
}