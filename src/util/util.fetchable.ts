export type FetchFunc<T> = () => Promise<T>

export class Fetchable<T = any> {
    private _value: T
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

    get value() {
        return this._value;
    }

    get fetch() {
        if (this._valuePromise == null) {
            this._valuePromise = new Promise(async resolve => {
                this._value = await this.fetchFunc();
                resolve(this._value);
            })
        }
        return this._valuePromise
    }

    refetch() {
        this._valuePromise = null;
        return this.fetch
    }

    get isFetching() {
        return this._valuePromise != null;
    }
}
