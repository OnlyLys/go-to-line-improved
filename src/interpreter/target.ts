import { Selection, Position } from 'vscode';

/** 
 * The target specified by the input. 
 * 
 * There are two kinds of targets:
 * 1. A position to move the cursor to (i.e. a 'go to').
 * 2. A range to make a selection of. The `quick` flag specifies whether the selection was a 'quick
 *    selection' or not. For more information about the different kinds of selections please see the 
 *    readme.
 */
export type Target = TargetGoTo | TargetSelection;

    interface TargetGoTo {
        kind: 'goTo';
        position: Position;
    }

    interface TargetSelection {
        kind: 'selection';
        selection: Selection;
        quick: boolean;
    }
