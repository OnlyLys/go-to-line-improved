/** The kind of selection that the input describes. */
export enum SELECTION_MODE {

    /** 
     * Since no selection mode is explicitly asked for, this is equivalent to a 'Go To'. This means
     * we should interpret the entire input as specifying a single location in the document.
     */
    NONE,

    /** Select a range defined by two input `Coordinates`. */
    SELECT,

    /** 
     * Select a range from cursor (more specifically the primary selection's `active`) to a target 
     * `Coordinate`. 
     */
    SELECT_FROM_CURSOR,

    /** 
     * Same as `SELECT` but the selection will expand to completely cover the start and end lines.
     * 
     * For instance, if a selection starts at line 5 character 20 and ends at line 10 character 40,
     * it will be expanded to start from the beginning of line 5 and end at the end of line 10.
     */
    QUICK_SELECT,

    /** 
     * Same expansion behavior as `QUICK_SELECT` but the `anchor` of the selection will be the 
     * primary selection's `active` before expansion.
     */
    QUICK_SELECT_FROM_CURSOR
    
}