export type FetchFunc<T> = () => Promise<T>;

/**
 * Lazily fetch data as required
 */
export class Fetchable<T = unknown> {
    /** Raw value if the value has been fetched */
    value: T | null = null;
    /** Last reported error if it exists */
    error: Error | null = null;
    valuePromise: Promise<T> | null = null;
    fetchFunc: FetchFunc<T | null>;

    constructor(fetchFunc: T | FetchFunc<T>) {
        if (typeof fetchFunc === 'function') {
            this.fetchFunc = fetchFunc as FetchFunc<T>;
        } else {
            this.init(fetchFunc);
            this.fetchFunc = (): Promise<T | null> => Promise.resolve(this.value);
        }
    }
    /** Initialize the fetchable with a value so it does not need to be fetched */
    init(value: T): void {
        this.valuePromise = Promise.resolve(value);
        this.value = value;
    }

    /**
     * Fetch the value if the value has not been fetched
     */
    fetch(): Promise<T> {
        if (this.valuePromise == null) {
            this.valuePromise = new Promise(async (resolve, reject) => {
                try {
                    this.value = await this.fetchFunc();
                    if (this.value == null) {
                        throw new Error('No value was returned');
                    }
                    resolve(this.value);
                } catch (e) {
                    this.error = e as Error;
                    reject(e);
                }
            });
        }
        return this.valuePromise;
    }

    /** Force refetch the value */
    refetch(): Promise<T> {
        this.valuePromise = null;
        return this.fetch();
    }

    /** Is the value currently in the process of being fetched */
    get isFetching(): boolean {
        return this.valuePromise != null && this.value == null;
    }
}
