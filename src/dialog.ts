import { window, InputBox, Disposable } from 'vscode';

/** 
 * A dialog box that allows us to specify reactions to user input. This class only provides the 
 * framework of the dialog, while the implemention is defined at construction time.
 * 
 * Note that this class is 'self-disposing'. In circumstances where the dialog is hidden, `close`
 * will be called automatically.
 */
export class Dialog {

    /** 
     * We display input boxes using VS Code's `InputBox` API. Our `Dialog` class will essentially be 
     * a wrapper around this class.
     * 
     * Note that in a few circumstances (for instance if the user switches tabs or more generally 
     * defocuses the input box) the editor will forcefully hide this `InputBox`. Therefore, our 
     * `Dialog` class has to react to those circumstances accordingly by doing appropriate clean up.
     */
    private inputBox: InputBox;

    /** Listener that is triggered on each input change. */
    private onDidChangeListener: Disposable;

    /** 
     * Listener is triggered whenever the current selection in the editor is changed. 
     * 
     * Note that if the user clicks out of the `InputBox` to a position in the text, both this and 
     * `this.onDidHideListener` are triggered. But this listener is triggered before the latter. 
     */
    private selectionChangeListener: Disposable;

    /** 
     * Listener is triggered whenever the user accepts the input via the `Enter` key. Note that 
     * just because the user pressed `Enter`, it doesn't mean that we have to accept the input. We
     * should still check that the input has the correct format first.
     */
    private onDidAccept: Disposable; 

    /** 
     * Listener is triggered when `this.inputBox` hides. The actions that may cause an `InputBox` to 
     * hide are:
     * 
     * 1. When the user switches editor tabs.
     * 2. When the user presses `Escape`.
     * 3. When the user clicks out of the input box.
     * 4. When the `InputBox` is hidden by calling `InputBox.hide`.
     */
    private onDidHideListener: Disposable;

    /** 
     * Show a dialog box for user input.
     * 
     * @param placeholder Text to show in the input field when it is empty.
     * @param validate Callback used to validate the value in the input field once during instantiation 
     * of this class and subsequently during each input change. The return value of this callback 
     * determines what kind of message we show to the user as feedback. The value of the `ok` property 
     * determines the styling of the dialog box. For instance, when `ok: false`, the dialog box will 
     * have a style that indicates input error. The `message` property is the string that will be 
     * shown to the user as feedback. 
     * @param onDidHideViaEscapeOrFocusChange Callback that is triggered after the dialog box is 
     * hidden via an `Escape` keypress or via focus switch (e.g. switching to a different editor tab).
     * @param onDidHideViaSelectionInterrupt Callback that is triggered after the user selects text 
     * in the editor while the dialog is open (i.e. clicking out of the input box), which causes the 
     * dialog to close. 
     * @param onDidAccept Callback that is triggered after the user accepts the input (via `Enter` key).
     * However, just because the user has accepted an input does not mean that we have to accept it.
     * It is expected that the supplier of this callback checks that the input is indeed valid and
     * indicates the result via the return value. If the return value of this callback is `true` the
     * dialog box will close, otherwise it will be kept open. Note that closing the dialog box here 
     * will not subsequently trigger `onDidHideViaEscapeOrFocusChange` nor `onDidHideViaSelectionInterrupt`.
     */
    public constructor(behavior: {
        placeholder: string,
        validate: (value: string) => { ok: boolean, message: string },
        onDidHideViaEscapeOrFocusChange: () => void,
        onDidHideViaSelectionInterrupt: () => void,
        onDidAccept: (value: string) => boolean,
    }) {
        this.inputBox = window.createInputBox();
        this.inputBox.show();
        this.inputBox.placeholder = behavior.placeholder;

        // Make sure that the dialog box shows the correct feedback at initialization.
        showFeedback(this.inputBox, behavior.validate(this.inputBox.value));

        this.onDidChangeListener = this.inputBox.onDidChangeValue(() =>
            showFeedback(this.inputBox, behavior.validate(this.inputBox.value))
        );

        this.selectionChangeListener = window.onDidChangeTextEditorSelection(() => {
            behavior.onDidHideViaSelectionInterrupt();
            // Because we call dispose here, `this.onDidHideListener` is not subsequently triggered.
            this.close();
        });

        this.onDidAccept = this.inputBox.onDidAccept(() => {
            if (behavior.onDidAccept(this.inputBox.value)) {
                this.close();
            }
        });

        this.onDidHideListener = this.inputBox.onDidHide(() => { 
            // Since both `this.selectionChangeListener` and `this.onDidAccept` call `this.close`
            // at the end of their execution, this callback only executes when the input box is 
            // hidden via `Escape` keypress or and editor tab change.
            behavior.onDidHideViaEscapeOrFocusChange(); 
            this.close();
        });

        function showFeedback(inputBox: InputBox, result: { ok: boolean, message: string }): void {
            const { ok, message } = result;
            if (ok) {
                inputBox.prompt = message; 
                inputBox.validationMessage = '';
            } else {
                inputBox.prompt = '' ;  
                inputBox.validationMessage = message;
            }
        }
    }

    /** Close the dialog box. */
    public close(): void {
        this.onDidChangeListener.dispose();
        this.onDidAccept.dispose();
        this.selectionChangeListener.dispose();
        // Must dispose `this.onDidHideListener` before `this.inputBox`, because when the latter
        // is disposed of, it triggers `this.onDidHideListener`, which will then call `this.close` 
        // at the end of its execution and cause infinite recursion.
        this.onDidHideListener.dispose();
        this.inputBox.dispose();
    }

    /** Equivalent to calling `close`. */
    public dispose(): void {
        this.close();
    }

}