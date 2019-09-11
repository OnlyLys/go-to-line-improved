import { ThemeColor } from 'vscode';
import { EXT_IDENT } from './extension';
import { ConfigurationHandler } from '@onlylys/vscode-configuration-handler';
import { TERMINAL } from './grammar/terminal';

/** Class containing a readonly snapshot of the configuration values of this extension. */
export class Configuration {

    /** Color of the pseudocursor when revealing the target of a 'Go To' or selection. */
    public readonly pseudocursorColor: string | ThemeColor;
    
    /** Color used to highlight the target range of a selection. */
    public readonly selectionHighlightColor: string | ThemeColor;

    /** Color used to highlight the target line of a 'Go To'. */
    public readonly goToLineHighlightColor: string | ThemeColor;
    
    /** 
     * The delay in `ms` before changing the viewport to reveal a target that is partially or totally
     * outside the visible region of the viewport.
     */
    public readonly viewportChangeDelay: number;

    /** The default behavior to use for the character term if it is omitted. */
    public readonly defaultCharacterBehavior: TERMINAL;

    private constructor() {
        this.pseudocursorColor        = pseudocursorColorHandler.get().effectiveValue;
        this.selectionHighlightColor  = selectionHighlightColorHandler.get().effectiveValue;
        this.goToLineHighlightColor   = goToLineHighlightColorHandler.get().effectiveValue;
        this.viewportChangeDelay      = viewportChangeDelayHandler.get().effectiveValue;
        this.defaultCharacterBehavior = defaultCharacterBehaviorHandler.get().effectiveValue;
    }

    /** Get the latest values of the extension's settings. */
    public static get(): Configuration {
        return new Configuration();
    }

}

function isColorType(value: any): value is (string | ThemeColor) {
    return typeof value === 'string' || (typeof value === 'object' && typeof value.id === 'string');
}

export const pseudocursorColorHandler = new ConfigurationHandler<string | ThemeColor>({
    name: `${EXT_IDENT}.pseudocursorColor`,
    typecheck: isColorType
});

export const selectionHighlightColorHandler = new ConfigurationHandler<string | ThemeColor>({
    name: `${EXT_IDENT}.selectionHighlightColor`,
    typecheck: isColorType
});

export const goToLineHighlightColorHandler = new ConfigurationHandler<string | ThemeColor>({
    name: `${EXT_IDENT}.goToLineHighlightColor`,
    typecheck: isColorType
});


export const viewportChangeDelayHandler = new ConfigurationHandler<number>({
    name: `${EXT_IDENT}.viewportChangeDelay`,
    typecheck: (value: any): value is number => typeof value === 'number'
});

// Only these possibilities for default behavior are allowed when a character term is not specified
const DEFAULT_CHARACTER_BEHAVIOR_TERMINALS = [
    TERMINAL.START_OF_LINE_SHORTCUT,
    TERMINAL.END_OF_LINE_SHORTCUT,
    TERMINAL.FIRST_NON_WHITESPACE_CHARACTER_SHORTCUT,
    TERMINAL.ONE_PAST_LAST_NON_WHITESPACE_CHARACTER_SHORTCUT,
];

export const defaultCharacterBehaviorHandler = new ConfigurationHandler<TERMINAL>({
    name: `${EXT_IDENT}.defaultCharacterBehavior`,
    typecheck: (value: any): value is TERMINAL => {
        return DEFAULT_CHARACTER_BEHAVIOR_TERMINALS.includes(value);
    }
});
