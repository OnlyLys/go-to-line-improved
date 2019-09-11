import { ExtensionContext, commands, window } from 'vscode';
import { Controller } from './controller';

export const EXT_NAME  = 'Select to Line...';           // Extension name
export const EXT_IDENT = 'select-to-line';           // Extension identifier

export function activate(context: ExtensionContext) {
    const controller = new Controller();
    const openCommand = commands.registerCommand(`${EXT_IDENT}.open`, () => {
        if (window.activeTextEditor) {
            controller.show(window.activeTextEditor);
        } else {
            controller.showDisabled();
        }
    });
    context.subscriptions.push(openCommand, controller);
}

export function deactivate() {
    // Intentionally empty
}