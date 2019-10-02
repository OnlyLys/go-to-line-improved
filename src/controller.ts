import { Dialog } from './dialog';
import { Selection, TextEditor, Disposable, Range, TextEditorRevealType } from 'vscode';
import { Config } from './config/config';
import { interpret } from './interpreter/interpret';
import { Highlighter } from './highlighter';
import { Delayer } from './delayer';
import { lineIsVisible, rangeIsFullyVisible, rangeCanFitWithinViewport } from './is-visible';

export class Controller {

    /** This array contains items that should be disposed of if the extension closes abruptly. */
    private disposables: Disposable[] = [];

    /** Show a dialog that takes in input and reveals the specified range. */
    public show(editor: TextEditor): void {

        this.dispose();

        const config = Config.get();

        const delayer = new Delayer(config.viewportChangeDelay);

        const highlighter = new Highlighter(
                                editor, 
                                config.lineHighlightColor,
                                config.rangeHighlightColor,
                                config.pseudocursorColor
                            );

        const initialVisibleVerticalRange = editor.visibleRanges[0];

        const dialog = new Dialog({

            // Show a usage guide when the input zone is empty.
            placeholder: `Usage: <line>[,<column>][.[.]<line>[,<column>]] | Example: 1,10..5,20 or -3,5.-10`,

            // On each input change, reinterpret the input.
            validate: (value) => {
                // Clear any previously scheduled actions so that the viewport does not suddenly 
                // change later due to a previously correct input.
                delayer.clear();
                const target = interpret(value, editor, config);
                if (!target) {
                    // Current input in the dialog is invalid.
                    highlighter.clear();
                    const { selection: { active: cursor }, document } = editor;
                    return { 
                        ok: false, 
                        message: `Current Line: ${cursor.line + 1}, Column: ${cursor.character + 1}. \
                        Type a line number between 1 and ${document.lineCount} to navigate to.`
                    };
                }
                if (target.kind === 'goTo') {
                    const range = new Range(target.position, target.position);
                    if (lineIsVisible(editor, target.position.line)) {
                        // If the line is visible within the current viewport then no shifting of 
                        // the viewport is required when showing a preview of the 'go to' operation. 
                        // Since no shifting is required we do not need a delay.
                        //
                        // The `Default` reveal type does not shift the viewport when the target 
                        // range is within the viewport.
                        editor.revealRange(range, TextEditorRevealType.Default);
                        highlighter.goTo(target.position);
                    } else {
                        // Since the line is not visible within the current viewport we have to
                        // shift the viewport in order to preview the target. However, we need
                        // to use a delay so that the view does not rapidly change when the user
                        // is in the middle of input.
                        delayer.queue(() => {
                            editor.revealRange(range, TextEditorRevealType.InCenter);
                            highlighter.goTo(target.position);
                        });
                    }
                    const { line, character } = target.position;
                    return { 
                        ok: true, 
                        message: `Go to line ${line + 1} and column ${character + 1}.` 
                    };
                } else {
                    if (rangeIsFullyVisible(editor, target.selection)) {
                        // Since the target selection is fully visible, no viewport shifting is
                        // required. Thus we can show without delay. 
                        editor.revealRange(target.selection, TextEditorRevealType.Default);
                        highlighter.selection(target.selection, target.quick);
                    } else if (rangeCanFitWithinViewport(editor, target.selection)) {
                        // While the target selection is not fully visible, it can fit within the
                        // vertical height of the viewport. Thus we shift to center it within the
                        // viewport.
                        delayer.queue(() => {
                            editor.revealRange(target.selection, TextEditorRevealType.InCenter);
                            highlighter.selection(target.selection, target.quick);
                        });
                    } else {
                        // Since the target selection cannot fit within the viewport, we prefer to
                        // show the `active` part of the selection. The `Default` reveal type 
                        // achieves that.
                        delayer.queue(() => {
                            editor.revealRange(target.selection, TextEditorRevealType.Default);
                            highlighter.selection(target.selection, target.quick);
                        });
                    }
                    const { anchor, active } = target.selection;
                    return {
                        ok: true,
                        message: `Select from line ${anchor.line + 1} and column ${anchor.character + 1} \ 
                        to line ${active.line + 1} and column ${active.character + 1}`
                    };
                }
            },

            // Restore the view after an `Escape` keypress or focus change to conform to the behavior
            // of VS Code's default 'Go to Line...' functionality. 
            onDidHideViaEscapeOrFocusChange: () => {
                delayer.clear();
                highlighter.clear();
                // Restore the vertical view.
                editor.revealRange(initialVisibleVerticalRange, TextEditorRevealType.AtTop);
                // Due limitations in VS Code's API, it's not possible to perfectly restore the 
                // horizontal part of the viewport to what it was because there is no method 
                // available to query the viewport's horizontal state: 
                // https://github.com/Microsoft/vscode/issues/58954.
                //
                // Therefore when there is only one cursor (which is most of the time), we use the 
                // default reveal strategy to show that cursor. But when there are multiple cursors
                // it makes no sense to prefer revealing one cursor over another so we don't do so.
                if (editor.selections.length === 1) {
                    editor.revealRange(editor.selection, TextEditorRevealType.Default);
                }
            },

            // Cancel any previously queued reveals after a click out. The view does not have to 
            // be restored since the view will be changed by the user having made the selection.
            onDidHideViaSelectionInterrupt: () => {
                delayer.clear();
                highlighter.clear();
            },

            // Just because the user has accepted the input, does not mean that the input is valid 
            // and should be accepted right away. Instead we have to check its validity first.
            onDidAccept: (value) => {
                const target = interpret(value, editor, config);
                if (!target) {
                    // Input is invalid. Cannot close the dialog since we refuse the input.
                    return false;
                }
                delayer.clear();
                highlighter.clear();
                // Since input is valid, we can change the cursor to the desired target.
                if (target.kind === 'goTo') {
                    editor.selection = new Selection(target.position, target.position);
                } else {
                    editor.selection = target.selection;
                }
                return true;
            }

        });

        this.disposables.push(dialog, highlighter, delayer);
    }

    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables.length = 0;
    }

}
