import { Log, CogLogger } from '../util/util.log';
import { CogSource } from './cog.source';

/**
 * Chunked source for COGS
 */
export abstract class CogSourceChunked extends CogSource {
    /** size of chunks to fetch (Bytes) */
    abstract chunkSize: number;
    /**
     * Max number of chunks to load in one go
     * Requested chunks could be more than this number if blankFillCount is used
     */
    abstract maxChunkCount: number;

    /**
     * number non requested chunks to load even
     * This allows one fetch for semi sparse requests eg requested [1,5]
     * instead of two fetches [1] & [5] run one fetch [1,2,3,4,5]
     */
    blankFillCount = 16;

    /* List of chunk ids to fetch */
    toFetch: boolean[] = [];
    toFetchPromise: Promise<ArrayBuffer[]> | null = null;
    abstract loadChunks(firstChunk: number, lastChunk: number, log: CogLogger): Promise<ArrayBuffer>;

    /**
     * Split the ranges into a consecutive chunks

     * @param ranges list of chunks to fetch

     * @param maxChunks maximum number of chunks to load
     */
    static getByteRanges(
        ranges: string[],
        chunkCount: number = 32,
        blankFillCount = 16,
    ): { chunks: number[][]; blankFill: number[] } {
        if (ranges.length === 0) {
            return { chunks: [], blankFill: [] };
        }
        const sortedRange = ranges.map(c => parseInt(c, 10)).sort((a, b) => a - b);

        const chunks: number[][] = [];
        let current: number[] = [];
        chunks.push(current);
        const blankFill = [];

        for (let i = 0; i < sortedRange.length; ++i) {
            const currentValue = sortedRange[i];
            const lastValue = sortedRange[i - 1];
            if (current.length >= chunkCount) {
                current = [currentValue];
                chunks.push(current);
            } else if (i === 0 || currentValue === lastValue + 1) {
                current.push(currentValue);
            } else if (currentValue < lastValue + blankFillCount) {
                // Allow for non continuos chunks to be requested to save on fetches
                for (let x = lastValue; x < currentValue; x++) {
                    current.push(x + 1);
                    blankFill.push(x + 1);
                }
                // Last value was actually requested so its not a blank fill
                blankFill.pop();
            } else {
                current = [currentValue];
                chunks.push(current);
            }
        }
        return { chunks, blankFill };
    }

    async fetchData(): Promise<ArrayBuffer[]> {
        const chunkIds = Object.keys(this.toFetch);
        this.toFetch = [];
        delete this.toFetchPromise;

        const ranges = CogSourceChunked.getByteRanges(chunkIds, this.maxChunkCount, this.blankFillCount);

        const chunkData: ArrayBuffer[] = [];

        // TODO putting this in a promise queue to do multiple requests
        // at a time would be a good idea.
        for (const chunkRange of ranges.chunks) {
            const firstChunk = chunkRange[0];
            const lastChunk = chunkRange[chunkRange.length - 1];
            const buffer = await this.loadChunks(firstChunk, lastChunk, Log.get());
            if (chunkRange.length == 1) {
                chunkData[chunkRange[0]] = buffer;
                continue;
            }

            const rootOffset = firstChunk * this.chunkSize;
            for (const chunkId of chunkRange) {
                const chunkOffset = chunkId * this.chunkSize - rootOffset;
                chunkData[chunkId] = buffer.slice(chunkOffset, chunkOffset + this.chunkSize);
            }
        }

        // These are extra chunks that were fetched, so lets prime the cache
        for (const chunkId of ranges.blankFill) {
            this.chunk(chunkId).init(chunkData[chunkId]);
        }

        return chunkData;
    }

    async fetchBytes(offset: number, count: number): Promise<ArrayBuffer> {
        const startChunk = Math.floor(offset / this.chunkSize);
        const endChunk = Math.floor((offset + count) / this.chunkSize) - 1;

        for (let i = startChunk; i <= endChunk; i++) {
            this.toFetch[startChunk] = true;
        }

        // Queue a fetch
        if (this.toFetchPromise == null) {
            this.toFetchPromise = new Promise<void>(resolve => setImmediate(resolve)).then(() => this.fetchData());
        }

        if (Object.keys(this.toFetch).length > 50) {
            throw new Error('Too many outstanding requests');
        }

        return this.toFetchPromise.then(results => results[startChunk]);
    }
}
