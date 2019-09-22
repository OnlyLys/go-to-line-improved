import { Token } from './token';

export class TokenStream {

    private i: number = 0;

    public constructor(private rawTokens: ReadonlyArray<Token>) {}

    /** 
     * Advance the token stream to the next token. This in effect discards one token from the stream.
     * 
     * Nothing is done if the token stream has been exhausted.
     */
    public advance(): void {
        if (this.i < this.rawTokens.length) {
            ++this.i;
        }
    }

    /** 
     * See the foremost element (if any) without removing it from the token stream.
     * 
     * The 'EOF' token is returned if the token stream has been exhausted.
     */
    public peek(): Readonly<Token> {
        return this.i < this.rawTokens.length ? this.rawTokens[this.i] : { kind: 'EOF' };
    }

    public hasTokensRemaining(): boolean {
        return this.i < this.rawTokens.length;
    }

}
