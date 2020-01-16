export type FetchFunc<T> = () => Promise<T>;

/**
 * Lazily fetch data as required
 */
export class Fetchable<T = any> {
    /** Raw value if the value has been fetched */
    private _value: T | null = null;
    /** If the last fetch errored */
    private _error: Error | null = null;
    private _valuePromise: Promise<T> | null = null;
    private fetchFunc: FetchFunc<T | null>;

    constructor(fetchFunc: T | FetchFunc<T>) {
        if (typeof fetchFunc === 'function') {
            this.fetchFunc = fetchFunc as FetchFunc<T>;
        } else {
            this.init(fetchFunc);
            this.fetchFunc = () => Promise.resolve(this._value);
        }
    }

    /**
     * Value if it exists
     * TODO should this throw this._error if it exists?
     */
    get value(): T | null {
        return this._value;
    }

    /** Last reported error if it exists */
    get error(): Error | null {
        return this._error;
    }

    /** Initialize the fetchable with a value so it does not need to be fetched */
    init(value: T) {
        this._valuePromise = Promise.resolve(value);
        this._value = value;
    }

    /**
     * Fetch the value if the value has not been fetched
     */
    fetch(): Promise<T> {
        if (this._valuePromise == null) {
            this._valuePromise = new Promise(async (resolve, reject) => {
                try {
                    this._value = await this.fetchFunc();
                    if (this._value == null) {
                        throw new Error('No value was returned');
                    }
                    resolve(this._value);
                } catch (e) {
                    this._error = e;
                    reject(e);
                }
            });
        }
        return this._valuePromise;
    }

    /** Force refetch the value */
    refetch() {
        this._valuePromise = null;
        return this.fetch;
    }

    /** Is the value currently in the process of being fetched */
    get isFetching() {
        return this._valuePromise != null;
    }
}
