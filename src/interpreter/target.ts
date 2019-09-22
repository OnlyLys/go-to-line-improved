import { Selection, Position } from 'vscode';

/** 
 * The target specified by the input. 
 * 
 * There are two kinds of targets:
 * 1. A position to move the cursor to (i.e. a 'go to').
 * 2. A range to make a selection of. This is a distillation of the various different ways that we
 *    were able to specify a selection (such as 'quick select', 'select from cursor', etc.). For 
 *    more information please see the usage guide.
*/
export type Target = TargetGoTo | TargetSelection;

    interface TargetGoTo {
        kind: 'goTo';
        position: Position;
    }

    interface TargetSelection {
        kind: 'selection';
        selection: Selection;
    }
