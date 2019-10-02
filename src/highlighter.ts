import { window, TextEditor, ThemeColor, Range, TextEditorDecorationType, Selection, Position } from 'vscode';

/** 
 * Helper class used to highlight the target of operations.
 * 
 * Only one highlight can be active at any time. When applying a new highlight the previous one will
 * always be cleared first.
 */
export class Highlighter {

    /** When disposed of, will remove all the decorations from the editor. */
    private disposables: TextEditorDecorationType[] = [];

    /** Helper class used to highlight the target of operations. */
    public constructor(
        private editor:              TextEditor, 
        private lineHighlightColor:  string | ThemeColor,
        private rangeHighlightColor: string | ThemeColor,
        private pseudocursorColor:   string | ThemeColor
    ) {}

    /** 
     * Highlight the target of a 'go to' operation. 
     * 
     * The entire line that `position` is on will be highlighted from the left edge to the right 
     * edge of the viewport. Furthermore, a pseudocursor will be placed at `position`.
     */
    public goTo(position: Position): void {
        this.clear();
        this.colorLines(position.line, position.line);
        this.placePseudocursor(position);
    }

    /** 
     * Highlight a selection in the editor. 
     * 
     * The exact selection will be highlighted unless the `whole` flag is `true`, where instead the 
     * entire lines of the selection will be highlighted.
     * 
     * Pseudocursors will be placed at the `active` and `anchor` positions of the selection, where
     * the pseudocursor at `active` will be solid while the one at `anchor` will be dotted.
     */
    public selection(selection: Selection, whole?: boolean): void {
        this.clear();
        if (whole) {
            this.colorLines(selection.start.line, selection.end.line);
        } else {
            const selectionHighlight = window.createTextEditorDecorationType({ 
                backgroundColor: this.rangeHighlightColor,
            });
            this.editor.setDecorations(selectionHighlight, [ selection ]);
            this.disposables.push(selectionHighlight);
            // When decorating a multiline range in VS Code (as we have done above), all line breaks at
            // the end of sentences are ignored. So here we manually highlight them to mimic the style
            // that the editor uses when a user makes a selection with the mouse or keyboard.
            if (!selection.isSingleLine) {
                const lineBreakHighlights = window.createTextEditorDecorationType({
                    borderColor: this.rangeHighlightColor,
                    borderStyle: `none solid none none`,
                    borderWidth: `0.5em`,
                });
                const lineBreakRanges: Range[] = [];
                for (let i = selection.start.line; i < selection.end.line; ++i) {
                    const endPos = this.editor.document.lineAt(i).range.end;
                    lineBreakRanges.push(new Range(endPos, endPos));
                }
                this.editor.setDecorations(lineBreakHighlights, lineBreakRanges);
                this.disposables.push(lineBreakHighlights);
            }
        }
        // Place the pseudocursors to indicate the direction of the selection.
        this.placePseudocursor(selection.anchor, true);
        this.placePseudocursor(selection.active);
    }

    /** Remove the all existing highlights. */
    public clear(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

    /** Equivalent to calling `clear`. */
    public dispose(): void {
        this.clear();
    }

    /** Color lines completely from the left edge to the right edge of the viewport. */
    private colorLines(fromLineIndex: number, toLineIndex: number): void {
        this.clear();
        const highlight = window.createTextEditorDecorationType({ 
            backgroundColor: this.lineHighlightColor, 
            isWholeLine:     true 
        });
        this.editor.setDecorations(
            highlight, 
            [ new Range(fromLineIndex, 0, toLineIndex, 0) ]
        );
        this.disposables.push(highlight);
    }

    /** 
     * Place a pseudocursor at a specific position. The cursor will be placed *before* the character
     * at that position. If `dotted` is `true` the pseudocursor will be a dotted instead of solid.
     */
    private placePseudocursor(position: Position, dotted?: boolean): void {
        // We try our best to mimic VS Code's way of decorating the cursor.
        if (position.character === 0) {
            // When cursor is at start of line, both halves are crammed into the first character.
            const cursorAtLineStart = window.createTextEditorDecorationType({
                borderColor: this.pseudocursorColor,
                borderStyle: `none ${dotted ? 'dotted' : 'solid'} none none`,
                borderWidth: '2px',
            });
            this.editor.setDecorations(cursorAtLineStart, [ new Range(position, position) ]);
            this.disposables.push(cursorAtLineStart);
        } else {
            // Otherwise if cursor is at character index n > 0, half of it is within the end of 
            // index n and half within the start of index n - 1.
            const cursorFirstHalf = window.createTextEditorDecorationType({
                borderColor: this.pseudocursorColor,
                borderStyle: `none ${dotted ? 'dotted' : 'solid'} none none`,
                borderWidth: '1px',
            });
            this.editor.setDecorations(cursorFirstHalf, [ new Range(position.translate(0, -1), position) ]);
            const cursorSecondHalf = window.createTextEditorDecorationType({
                borderColor: this.pseudocursorColor,
                borderStyle: `none none none ${dotted ? 'dotted' : 'solid'}`,
                borderWidth: '1px',
            });
            this.editor.setDecorations(cursorSecondHalf, [ new Range(position, position) ]);
            this.disposables.push(cursorFirstHalf, cursorSecondHalf);
        }
    }

}
