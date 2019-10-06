/** 
 * Variant-like type used to indicate success or failure of during parsing operations. This is used
 * to avoid throwing exceptions.
 * 
 * This type was inspired by Rust.
 */
export type Result<T> = ResultOk<T> | ResultErr<T>;

    interface ResultOk<T> {
        ok: true;
        value: T;
        /** 
         * Transform the value contained within a result type if it is of the `ResultOk` variant,
         * Otherwise just return the `ResultErr` variant.
         */
        andThen: (<U>(transform: (t: T) => U) => Result<U>);
    }

    interface ResultErr<T> { 
        ok: false;
        /** 
         * Transform the value contained within a result type if it is of the `ResultOk` variant,
         * Otherwise just return the `ResultErr` variant.
         */
        andThen: (<U>(transform: (t: T) => U) => Result<U>);
    }


export function Ok<T>(value: T): Result<T> {
    return {
        ok: true,
        value,
        andThen: <U>(transform: (t: T) => U): Result<U> => {
            return Ok(transform(value));
        }
    };
}

/** Create an `Err` variant. */
export function Err<T>(): ResultErr<T> {
    return {
        ok: false,
        andThen: <U>(_: (t: T) => U): Result<U> => {
            return Err();
        }
    };
}
