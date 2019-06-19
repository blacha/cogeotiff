export type FetchFunc<T> = () => Promise<T>

/**
 * Lazily fetch data as requried
 */
export class Fetchable<T = any> {
    /** Raw value if the value has been fetched */
    private _value: T
    /** If the last fech errored */
    private _error: Error
    /**  */
    private _valuePromise: Promise<T>;
    private fetchFunc: FetchFunc<T>;

    constructor(fetchFunc: T | FetchFunc<T>) {
        if (typeof fetchFunc === 'function') {
            this.fetchFunc = fetchFunc as FetchFunc<T>;
        } else {
            this._value = fetchFunc;
            this._valuePromise = Promise.resolve(this._value)
            this.fetchFunc = () => Promise.resolve(this._value);
        }
    }

    /**
     *  Value if it exists
     * TODO should this throw this._error if it exists
     */
    get value() {
        return this._value;
    }

    /**
     * Fetch the value if the value has not been fetched
     */
    get fetch() {
        if (this._valuePromise == null) {
            this._valuePromise = new Promise(async resolve => {
                try {
                    this._value = await this.fetchFunc();
                    resolve(this._value);
                } catch (e) {
                    this._error = e;
                    throw e;
                }
            })
        }
        return this._valuePromise
    }

    /** Force refetch the value */
    refetch() {
        this._valuePromise = null;
        return this.fetch
    }

    /** Is the value currently in the process of being fetched */
    get isFetching() {
        return this._valuePromise != null;
    }
}
