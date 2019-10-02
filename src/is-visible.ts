import { TextEditor, Range } from "vscode";

/** Returns `true` if the line with `lineIndex` is visible within the active viewport. */
export function lineIsVisible(editor: Readonly<TextEditor>, lineIndex: number): boolean {
    const { start: { line: viewportStart }, end: { line: viewportEnd } } = editor.visibleRanges[0];
    return lineIndex >= viewportStart && lineIndex <= viewportEnd;
}

/**
 * Note when we say 'visible' we mean vertical visibility and not horizontal, since there is no way
 * in VS Code's API (at least as of 1.33) to get the visible visible horizontal ranges.
 * 
 * This function returns `false` if the range is only partially visible or not visible at all.
 */
export function rangeIsFullyVisible(editor: Readonly<TextEditor>, range: Range): boolean {
    const { start: { line: viewportTop }, end: { line: viewportBottom } } = editor.visibleRanges[0];
    const { start: { line: rangeTop }, end: { line: rangeBottom } } = range;
    return rangeTop >= viewportTop && rangeBottom <= viewportBottom;
}

/** Returns `true` if `range` has a height that is lesser or equal to the height of the viewport. */
export function rangeCanFitWithinViewport(editor: Readonly<TextEditor>, range: Range): boolean {
    const { start: { line: viewportTop }, end: { line: viewportBottom } } = editor.visibleRanges[0];
    const { start: { line: rangeTop }, end: { line: rangeBottom } } = range;
    return (rangeTop - rangeBottom) <= (viewportTop - viewportBottom);
}
