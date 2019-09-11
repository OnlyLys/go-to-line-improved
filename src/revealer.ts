import { TextEditor, window, Range, TextEditorRevealType, TextEditorDecorationType, Selection, Position, Disposable, ThemeColor } from 'vscode';
import { Configuration } from './configuration';

/** Helper class used to reveal and highlight `Selection`s in a `TextEditor`. */
export class Revealer {
    
    /** Decorations that are currently alive in `this.editor`.  */
    private decorations: Disposable[] = [];

    /** 
     * Visible viewport range when this `Revealer` was initialized. 
     * 
     * With this information, we can restore the viewport to its initial state.
     */
    private initialVisibleRange: Range;

    /** 
     * Timeout timer used to delay any viewport changes when revealing. 
     * 
     * Using a delay prevents the viewport from rapidly changing while the user is inputting values.
     */
    private viewportChangeTimer: NodeJS.Timeout | undefined;

    /** 
     * Helper class used to reveal and highlight `Selection`s in a `TextEditor`.
     * 
     * The initial viewport state of the editor is recorded on instantiation of this class, and can 
     * be restored via the the `clear()` method with the `restore` parameter set to `true`.
     * 
     * @param editor The editor that the ranges are revealed in.
     * @param configuration The current configuration of the extension.
     */
    public constructor(private editor: TextEditor, private configuration: Configuration) {
        this.initialVisibleRange = editor.visibleRanges[0];
    }
    
    /** 
     * Reveal and highlight a location in the text. Unless `noDecorate` is `true`, the entire line 
     * that the target is on is highlighted. 
     * 
     * The reveal might be delayed depending on the location and height of the target selection
     * relative to the current viewport:
     * - If the target is within the viewport, the target is immediately revealed.
     * - If the target is outside the viewport then a delayed event is queued to reveal the selection. 
     *   We do this so that there is no rapid switching of the viewport while input is being received 
     *   (as is the case with the editor's own 'Go To Line...' feature), as that can be distracting. 
     * 
     * The delay can be disabled by setting `noDelay` to `true`. 
     * 
     * If a new reveal is called (whether via this method or via `this.revealSelection()`) before 
     * the previous one has executed, then the previous one will be cancelled.
     */
    public revealLocation(location: Position, options: { noDecorate?: boolean , noDelay?: boolean } = {}): void {
        this.clear();
        const _revealLocation = (center: boolean, delay: boolean): void => {
            if (delay) {
                this.viewportChangeTimer = setTimeout(
                    _revealLocation, 
                    this.configuration.viewportChangeDelay, 
                    center, 
                    // No further delays when this timer is triggered
                    false
                );
            } else {
                if (!options.noDecorate) {
                    this.decorations = decorateLocation({
                        editor: this.editor,
                        location,
                        highlightColor: this.configuration.goToLineHighlightColor,
                        pseudocursorColor: this.configuration.pseudocursorColor
                    });
                }
                this.editor.revealRange(
                    new Range(location, location), 
                    center ? TextEditorRevealType.InCenter: TextEditorRevealType.Default 
                );
            }
        };
        /* Note that due to limitations in VS Code's API (as of 1.33) we are only able to get the 
        visible vertical ranges of the viewport and not horizontal, so in the following lines of code, 
        we only deal with line numbers. When we say 'within the viewport' we mean within the vertical 
        range. */
        const { start: { line: viewportStart }, end: { line: viewportEnd } } = this.editor.visibleRanges[0];
        if (location.line >= viewportStart && location.line <= viewportEnd) {
            // Within viewport: Immediately show
            _revealLocation(false, false);
        } else {
            // If the target location is outside the viewport, then we want to center it when revealing
            _revealLocation(true, !options.noDelay);
        }
    }

    /** 
     * Reveal and highlight a selection. Unless `noDecorate` is `true`, the entire selection will be
     * highlighted.
     * 
     * The reveal might be delayed depending on the location and height of the target selection 
     * relative to the current viewport:
     * - If the target is within the viewport, the target is immediately revealed.
     * - If the target is partially or totally outside the viewport, then a delayed event is queued 
     *   to reveal the selection. We do this so that there is no rapid switching of the viewport while 
     *   input is being received (as is the case with the editor's own 'Go To Line...' feature), as 
     *   that can be distracting. 
     * 
     * The delay can be disabled by setting `noDelay` to `true`. 
     * 
     * If a new reveal is called (whether via this method or via `this.revealLocation()`) before 
     * the previous one has executed, then the previous one will be cancelled.
     */
    public revealSelection(selection: Selection, options: { noDecorate?: boolean , noDelay?: boolean } = {}): void {
        this.clear();
        const _revealSelection = (target: Selection, center: boolean, delay: boolean): void => {
            if (delay) {
                // Call `_revealSelection` later
                this.viewportChangeTimer = setTimeout(
                    _revealSelection, 
                    this.configuration.viewportChangeDelay,
                    target,
                    center,
                    // No further delays when this timer is triggered
                    false
                );
            } else {
                if (!options.noDecorate) {
                    this.decorations = decorateSelection({
                        editor: this.editor,
                        selection: target,
                        highlightColor: this.configuration.selectionHighlightColor,
                        pseudocursorColor: this.configuration.pseudocursorColor
                    });
                }
                this.editor.revealRange(
                    target, 
                    center ? TextEditorRevealType.InCenter: TextEditorRevealType.Default 
                );
            }
        };
        /* Note that due to limitations in VS Code's API (as of 1.33) we are only able to get the 
        visible vertical ranges of the viewport and not horizontal, so in the following lines of code, 
        we only deal with line numbers. When we say 'within the viewport' we mean within the vertical 
        range. */
        const { start: { line: viewportStart  }, end: { line: viewportEnd  } } = this.editor.visibleRanges[0];
        const { start: { line: selectionStart }, end: { line: selectionEnd } } = selection;
        if (selectionStart >= viewportStart && selectionEnd <= viewportEnd) {
            // Within viewport: Immediately show
            _revealSelection(selection, false, false);
        } else {
            const selectionHeight = selectionEnd - selectionStart;
            const viewportHeight  = viewportEnd - viewportStart;
            if (selectionHeight <= viewportHeight) {
                // Target selection can fit entirely within viewport: so center it
                _revealSelection(selection, true, !options.noDelay);
            } else {
                /* Target selection is taller than viewport: Shift viewport only as much as necessary 
                to show the `active` part of the target selection. */
                _revealSelection(new Selection(selection.active, selection.active), false, !options.noDelay);
            }
        }
    }

    /** 
     * Stop any reveals that may have been scheduled and remove all existing highlights. 
     * 
     * If `restore` is `true`, best effort will be made to restore the viewport to the state it was
     * when this `Revealer` was first initialized. We can only do best effort because VS Code does 
     * not (as of 1.33) allow querying the horizontal state of the viewport, hence we can only restore
     * the vertical state. 
     * 
     * However, as a limited workaround we can subsequently reveal the primary selection to somewhat
     * restore the horizontal view. But this only makes sense if there is a single selection. If 
     * there are multiple cursors (and thus multiple selections) then we don't bother attempting to 
     * restore the horizontal view, since we don't know which cursor the user was previously viewing.
     */
    public clear(restore?: boolean): void {
        if (this.viewportChangeTimer) {
            clearTimeout(this.viewportChangeTimer);
        }
        this.decorations.forEach(decoration => decoration.dispose());
        this.decorations = [];
        if (restore) {
            this.editor.revealRange(this.initialVisibleRange, TextEditorRevealType.AtTop);
            /* Due limitations in VS Code's API, it's not possible to perfectly restore the 
            horizontal part of the viewport to what it was because there is no method available to 
            query the viewport's horizontal state: https://github.com/Microsoft/vscode/issues/58954. */
            if (this.editor.selections.length === 0) {
                // Best effort reveal for a single cursor
                this.editor.revealRange(this.editor.selection, TextEditorRevealType.Default);
            }
        }
    }

    /* Stop any reveals that may have been scheduled and remove all existing highlights. */
    public dispose(): void {
        this.clear(false);
    }

}

/** 
 * The entire line that `location` is on is highlighted from the left edge to the right edge of the 
 * viewport. Furthermore a pseudocursor is placed at `location`.
 * 
 * The return value is an array of `TextEditorDecorationType`s which when disposed will remove the
 * decorations.
 */
function decorateLocation(args: {
    editor: TextEditor, 
    location: Position, 
    highlightColor: string | ThemeColor,
    pseudocursorColor: string | ThemeColor

}): TextEditorDecorationType[] 
{
    const { editor, location, highlightColor, pseudocursorColor } = args;
    const highlight = window.createTextEditorDecorationType({ 
        backgroundColor: highlightColor, 
        isWholeLine: true 
    });
    editor.setDecorations(highlight, [ new Range(location, location) ]);
    const pseudocursor = placePseudoCursor({ 
        editor, 
        position: location, 
        color: pseudocursorColor, 
        dotted: false 
    });
    return [ highlight, ...pseudocursor ];
}

/** 
 * The entire line selection is highlighted. Furthermore two pseudocursors are placed, one solid one 
 * at the `active` position of the selection, and another dotted at the `anchor`. 
 * 
 * The return value is an array of `TextEditorDecorationType`s which when disposed will remove the
 * decorations..
 */
function decorateSelection(args: {
    editor: TextEditor, 
    selection: Selection, 
    highlightColor: string | ThemeColor,
    pseudocursorColor: string | ThemeColor
}): TextEditorDecorationType[] 
{
    const { editor, selection, highlightColor, pseudocursorColor } = args;
    const ret: TextEditorDecorationType[] = [];
    const highlight = window.createTextEditorDecorationType({ 
        backgroundColor: highlightColor,
    });
    editor.setDecorations(highlight, [ selection ]);
    ret.push(highlight);
    /* When decorating a multiline selection in VS Code, all newline characters at the line ends are 
    ignored. So we have to manually highlight them to mimic what highlighting multiple lines looks 
    like when a user does it via a selection. */
    if (!selection.isSingleLine) {
        const lineBreakHighlights = window.createTextEditorDecorationType({
            borderColor: highlightColor,
            borderStyle: `none solid none none`,
            borderWidth: `0.5em`,
        });
        const lineBreakRanges: Range[] = [];
        for (let line = selection.start.line; line < selection.end.line; ++line) {
            const pos = editor.document.lineAt(line).range.end;
            lineBreakRanges.push(new Range(pos, pos));
        }
        editor.setDecorations(lineBreakHighlights, lineBreakRanges);
        ret.push(lineBreakHighlights);
    }
    ret.push(...placePseudoCursor({ 
        editor, 
        position: selection.anchor, 
        color: pseudocursorColor, 
        dotted: true  
    }));
    ret.push(...placePseudoCursor({ 
        editor, 
        position: selection.active, 
        color: pseudocursorColor, 
        dotted: false 
    }));
    return ret;
}

/** The pseudocursor will always be placed before the character at the target position. */
function placePseudoCursor(args: {
    editor: TextEditor,
    position: Position, 
    color: string | ThemeColor, 
    dotted: boolean
}): TextEditorDecorationType[] 
{
    const { editor, position, color, dotted } = args;
    // We try our best to mimic VS Code's way of decorating the cursor
    if (position.character === 0) {
        // When cursor is at start of line, it is crammed into the first character 
        const cursorAtLineStart = window.createTextEditorDecorationType({
            borderColor: color,
            borderStyle: `none ${dotted ? 'dotted' : 'solid'} none none`,
            borderWidth: '2px',
        });
        editor.setDecorations(cursorAtLineStart, [ new Range(position, position) ]);
        return [cursorAtLineStart];
    } else {
        /* Otherwise if cursor is at character index n > 0, half of it is within the end of 
        index n and half within the start of index n - 1. */
        const cursorFirstHalf = window.createTextEditorDecorationType({
            borderColor: color,
            borderStyle: `none ${dotted ? 'dotted' : 'solid'} none none`,
            borderWidth: '1px',
        });
        editor.setDecorations(cursorFirstHalf, [ new Range(position.translate(0, -1), position) ]);
        const cursorSecondHalf = window.createTextEditorDecorationType({
            borderColor: color,
            borderStyle: `none none none ${dotted ? 'dotted' : 'solid'}`,
            borderWidth: '1px',
        });
        editor.setDecorations(cursorSecondHalf, [ new Range(position, position) ]);
        return [cursorFirstHalf, cursorSecondHalf];
    }
}