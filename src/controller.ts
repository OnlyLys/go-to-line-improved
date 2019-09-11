import { Revealer } from './revealer';
import { Dialog } from './dialog';
import { Selection, TextEditor, Disposable, Position } from 'vscode';
import { EXT_NAME } from './extension';
import { Configuration } from './configuration';
import { parseInput } from './finite-automation/parse-input';
import { TERMINALS } from './grammar/terminal';

export class Controller {

    private disposables: Disposable[] = [];

    /** Show a dialog that takes in input and reveals the specified range. */
    public show(editor: TextEditor): void {
        this.dispose();
        const configuration = Configuration.get();
        const revealer = new Revealer(editor, configuration);
        const dialog = new Dialog({
            placeholder: USAGE_GUIDE,
            validate: (value) => {
                const result = parseInput(value, editor, configuration);
                if (result) {
                    // The parser accepted the input, thus it is a valid target in the document
                    result.isEmpty ? revealer.revealLocation(result.active) : revealer.revealSelection(result);
                    return { 
                        ok: true, 
                        message: result.isEmpty ? goToLineTextFrom(result.active) : selectionTextFrom(result)
                    };
                } else {
                    /* The parser rejected the input, that means at this moment the input in the 
                    dialog is invalid. Thus we want to terminate all previously scheduled actions so 
                    that the viewport does not suddenly change later due to a previously correct
                    input. */
                    revealer.clear();
                    return { 
                        ok: false, 
                        message: rejectionTextFrom(editor.document.lineCount) 
                    };
                }
            },
            onDidHideViaEscapeOrFocusChange: () => {
                /* We restore the view after an `Escape` keypress or focus change to conform with the
                behavior of VS Code's default 'Go To Line...' functionality. */
                revealer.clear(true);   
            },
            onDidHideViaSelectionInterrupt: () => {
                /* We do not need to restore the view after a click out because the user likely 
                intended to select something of interest in the viewport. It makes no sense for us
                to then take the user away from that. This behavior conforms with that of VS Code's
                default 'Go To Line...' functionality. */
                revealer.clear();
            },
            onDidAccept: (value) => {
                /* Just because the user wants to accept the input, doesn't mean we should. We have 
                to check that the input is valid first. */
                const result = parseInput(value, editor, configuration);
                if (result) {
                    // Since input is valid, we can change the cursor to the desired destination
                    editor.selection = result;
                    if (result.isEmpty) {
                        revealer.revealLocation(result.active, { noDecorate: true, noDelay: true });
                    } else {
                        revealer.revealSelection(result, { noDecorate: true, noDelay: true });
                    }
                    return true;
                } else {
                    /* If we get here, that means the parser rejected the input due to invalid syntax.
                    In this case we cannot close the dialog since we refuse to accept the input. */
                    return false;
                }
            }
        });
        this.disposables.push(revealer, dialog);

        function goToLineTextFrom(target: Position): string {
            return `Go to Line ${target.line + 1}, Character ${target.character + 1}`;
        }

        function selectionTextFrom({ active, anchor }: Selection): string {
            return `Select from Line ${anchor.line + 1}, Character ${anchor.character + 1} to \
                Line ${active.line + 1}, Character ${active.character + 1}`;
        }

        function rejectionTextFrom(editorLineCount: number): string {
            return `Type in a line number between 1 and ${editorLineCount}. \
                    See extension page for detailed usage guide.`;
        }

    }

    /** Show a dialog that does nothing but reject input. */
    public showDisabled(): void {
        this.dispose();
        const dialog = new Dialog({
            placeholder: '',
            validate: () => { 
                return { 
                    ok: false, 
                    message: `Open a text file first to use ${EXT_NAME}` 
                }; 
            },
            onDidAccept: () => false,
            onDidHideViaEscapeOrFocusChange: () => {},
            onDidHideViaSelectionInterrupt:  () => {}
        });
        this.disposables.push(dialog);
    }

    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

}

/** Brief usage guide to show in the input field when it is empty. */
const USAGE_GUIDE =
    `USAGE: <LINE>[${TERMINALS.COORDINATE_SEPARATOR}<CHAR>][${TERMINALS.SELECT_SEPARATOR}<LINE>[${TERMINALS.COORDINATE_SEPARATOR}<CHAR>]]`
    + ` | ` 
    + `EXAMPLE: 1${TERMINALS.COORDINATE_SEPARATOR}10${TERMINALS.SELECT_SEPARATOR}5${TERMINALS.COORDINATE_SEPARATOR}20`;