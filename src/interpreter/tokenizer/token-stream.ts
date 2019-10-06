import { Token } from './token';

export class TokenStream {

    private i: number = 0;

    public constructor(private rawTokens: ReadonlyArray<Token>) {}

    /** 
     * See the foremost element (if any) without removing it from the token stream.
     * 
     * The 'EOF' token is returned if the token stream has been exhausted.
     */
    public peek(): Readonly<Token> {
        return this.i < this.rawTokens.length ? this.rawTokens[this.i] : { kind: 'EOF' };
    }

    /** 
     * Remove then return the foremost element (if any) from the token stream. This advances the
     * token stream.
     * 
     * The 'EOF' token is returned if the token stream has been exhausted.
     */
    public pop(): Token {
        return this.i < this.rawTokens.length ? this.rawTokens[this.i++] : { kind: 'EOF' };
    }

    public hasTokensRemaining(): boolean {
        return this.i < this.rawTokens.length;
    }

}
