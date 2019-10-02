import { ExtensionContext, commands, window } from 'vscode';
import { Controller } from './controller';


export function activate(context: ExtensionContext) {
    const controller = new Controller();
    const openCommand = commands.registerCommand(`select-to-line.open`, () => {
        if (window.activeTextEditor) {
            controller.show(window.activeTextEditor);
        }
    });
    context.subscriptions.push(openCommand, controller);
}

export function deactivate() {
    // Intentionally empty.
}