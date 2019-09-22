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
        switch (input[i]) {
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
                // Since a number is a continuous sequence of digits, once we encounter the leading 
                // digit we have to look ahead to see if there are any more that follow.
                const digitStart = i;
                outer: 
                    while (i + 1 < input.length) {
                        switch (input[i + 1]) {
                            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
                                // The digits that follow are consumed from the input string.
                                ++i;
                                continue;
                            }
                            default:  {
                                break outer;
                            }
                        }
                    }
                tokens.push({ kind: 'number', valueStr: input.substring(digitStart, i + 1) });
                break;
            }
            case '-': {
                tokens.push({ kind: 'minus' });
                break;
            }
            case ',':
            case ':': {
                tokens.push({ kind: 'commaOrColon' });
                break;
            } 
            case '.': {
                // Since the `..` operator also starts with `.`, we have to look ahead by 1 character
                // to decide which operator is being used. 
                if (i + 1 < input.length && input[i + 1] === '.') {
                    tokens.push({ kind: 'doublePeriod' });
                    // Consume the second period from the input string.
                    ++i;
                } else {
                    tokens.push({ kind: 'period' });
                }
                break;
            }
            case 'H': {
                tokens.push({ kind: 'H' });
                break;
            }
            case 'L': {
                tokens.push({ kind: 'L' });
                break;
            }
            case 'h': {
                tokens.push({ kind: 'h' });
                break;
            }
            case 'l': {
                tokens.push({ kind: 'l' });
                break;
            }
            default: {
                return undefined;
            }
        }
    }
    return new TokenStream(tokens);
}
