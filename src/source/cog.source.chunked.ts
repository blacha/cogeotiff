import { CogSource } from '../cog.source';

/**
 * Chunked source for COGS
 */
export abstract class CogSourceChunked extends CogSource {
    abstract chunkSize: number;
    abstract maxChunkCount: number;

    /* List of chunk ids to fetch */
    toFetch: boolean[] = [];
    toFetchPromise: Promise<ArrayBuffer[]> | null = null;
    abstract loadChunks(chunkIds: number[][]): Promise<ArrayBuffer[]>;

    /**
     * Split the ranges into a consecutive chunks

     * @param ranges list of chunks to fetch
     * @param blankFill number non requested chunks to load even if they are not requested
     *          This allows one fetch for semi sparse requests eg requested [1,5]
     *          instead of two fetches [1] & [5] run one fetch [1,2,3,4,5]
     * @param maxChunks maximum number of chunks to load
     */
    static getByteRanges(ranges: string[], maxChunks = 32, blankFill = 5): number[][] {
        if (ranges.length === 0) {
            return [];
        }
        const sortedRange = ranges.map(c => parseInt(c, 10)).sort((a, b) => a - b);

        const groups: number[][] = [];
        let current: number[] = [];
        groups.push(current);

        for (let i = 0; i < sortedRange.length; ++i) {
            const currentValue = sortedRange[i];
            const lastValue = sortedRange[i - 1];
            if (current.length >= maxChunks) {
                current = [currentValue];
                groups.push(current);
            } else if (i === 0 || currentValue === lastValue + 1) {
                current.push(currentValue);
            } else if (currentValue < lastValue + blankFill) {
                // Allow for non continuos chunks to be requested to save on fetches
                for (let x = lastValue; x < currentValue; x++) {
                    current.push(x + 1);
                }
            } else {
                current = [currentValue];
                groups.push(current);
            }
        }
        return groups;
    }

    async fetchData(): Promise<ArrayBuffer[]> {
        const chunkIds = Object.keys(this.toFetch);
        this.toFetch = [];
        delete this.toFetchPromise;

        const chunks = CogSourceChunked.getByteRanges(chunkIds, this.maxChunkCount);
        return this.loadChunks(chunks);
    }

    async fetchBytes(offset: number, count: number): Promise<ArrayBuffer> {
        const startChunk = Math.floor(offset / this.chunkSize);
        const endChunk = Math.floor((offset + count) / this.chunkSize) - 1;
        if (startChunk != endChunk) {
            throw new Error(`Request too large start:${startChunk} end:${endChunk}`);
        }

        this.toFetch[startChunk] = true;

        // Queue a fetch
        if (this.toFetchPromise == null) {
            this.toFetchPromise = new Promise<void>(resolve => setImmediate(resolve)).then(() => this.fetchData());
        }

        if (Object.keys(this.toFetch).length > 50) {
            throw new Error('Too many requests');
        }

        return this.toFetchPromise.then(results => results[startChunk]);
    }
}
