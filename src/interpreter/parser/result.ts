/** 
 * Variant type used to indicate failures. This is used to avoid throwing exceptions.
 * 
 * This variant was inspired by Rust. 
 */
export type Result<T> = Ok<T> | Err;

    interface Ok<T> {
        kind: 'ok';
        value: T;
    }

    interface Err { 
        kind: 'err';
    }

/** 
 * Transform the value contained within a result type if it is of the `Ok` variant. Otherwise if the
 * result type is `Err` then return `Err` as well.
 */
export function andThen<T, U>(result: Result<T>, transform: (t: T) => U): Result<U> {
    return result.kind === 'ok' ? { kind: 'ok', value: transform(result.value) } : result;
}