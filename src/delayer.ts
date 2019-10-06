/** Class used to execute a callback with a time delay. */
export class Delayer {

    /** The Node JS timer type used to execute a delayed action. */
    private timer: NodeJS.Timeout | undefined;

    /** 
     * The time duration before execution of a queued event is determined by the `duration` field. 
     * This constructor throws if `duration` is negative.
     */
    public constructor(private duration: number) {
        if (duration < 0) {
            throw new Error('error: cannot use negative `duration` value for `Delayer`.');
        }
    }

    /** 
     * Queue an action to be executed at a delay. Only a maximum of one action can be queued at any 
     * time. If a new action is queued before the previous has fired, then the previous one will be
     * cancelled.
     * 
     * The time delay will be determined by the `duration` field provided in the constructor.
     */
    public queue(callback: () => void): void {
        this.clear();
        this.timer = setTimeout(callback, this.duration);
    }

    /** Clear the queued action (if there is one). */   
    public clear(): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }

    /** Equivalent to calling `clear`. */
    public dispose(): void {
        this.clear();
    }

}