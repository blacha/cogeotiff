import { ByteSize } from './bytes';
import { LogType } from './log';
export type ChunkId = number & { _type: 'chunkId' };

/** Shifting `<< 32` does not work in javascript */
const POW_32 = 2 ** 32;
/**
 * Chunked source for remote data
 *
 * Split a source into smaller chunks and load the bytes required in chunkSize amounts at a time
 *
 * This will also handle joining of consecutive requests, even when it is semi consecutive
 */
export abstract class ChunkSource {
    /** size of chunks to fetch (Bytes) */
    abstract chunkSize: number;
    /** Reference to the source */
    abstract uri: string;
    /** Name of the source, generally information like filename or url */
    abstract name: string;
    /** Type of the source, should be unique across all source types */
    abstract type: string;

    /** Is this source little endian */
    isLittleEndian = true;

    /**
     * Max number of chunks to load in one go
     * Requested chunks could be more than this number if blankFillCount is used
     *
     * @default 10
     */
    maxChunkCount = 10;

    // TODO this should ideally be a LRU
    // With a priority for the first few chunks (Generally where the main IFD resides)
    chunks: Map<number, DataView> = new Map();

    /**
     * number non requested chunks to load even
     * This allows one fetch for semi sparse requests eg requested [1,5]
     * instead of two fetches [1] & [5] run one fetch [1,2,3,4,5]
     */
    blankFillCount = 16;

    /** Maximum number of chunks to be requested at one time */
    maxConcurrentRequests = 50;

    /* List of chunk ids to fetch */
    protected toFetch: Set<number> = new Set();
    protected toFetchPromise: Promise<ArrayBuffer[]> | null = null;
    /**
     * Load the required chunks from the source
     *
     * @param firstChunk first chunkId to load
     * @param lastChunk last chunkId to load
     * @param log Logger for debugging
     *
     * @returns loaded chunk data as one buffer
     */
    protected abstract fetchBytesZ(offset: number, length: number, log?: LogType): Promise<ArrayBuffer>;

    close?(): Promise<void>;

    /**
     * Split the ranges into a consecutive chunks

     * @param ranges list of chunks to fetch

     * @param maxChunks maximum number of chunks to load
     */
    static getByteRanges(
        ranges: Set<number>,
        chunkCount = 32,
        blankFillCount = 16,
    ): { chunks: number[][]; blankFill: number[] } {
        if (ranges.size === 0) return { chunks: [], blankFill: [] };

        const sortedRange = [...ranges.values()].sort((a, b) => a - b);

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

    private async fetchData(logger?: LogType): Promise<ArrayBuffer[]> {
        const chunkIds = this.toFetch;
        this.toFetch = new Set();
        this.toFetchPromise = null;

        const ranges = ChunkSource.getByteRanges(chunkIds, this.maxChunkCount, this.blankFillCount);

        const chunkData: ArrayBuffer[] = [];

        // TODO putting this in a promise queue to do multiple requests
        // at a time would be a good idea.
        for (const chunkRange of ranges.chunks) {
            const firstChunk = chunkRange[0];
            const lastChunk = chunkRange[chunkRange.length - 1];
            logger?.trace({ chunks: chunkRange, chunkCount: chunkRange.length }, 'FetchChunk');
            const buffer = await this.fetchBytesZ(
                firstChunk * this.chunkSize,
                lastChunk * this.chunkSize + this.chunkSize,
                logger,
            );
            if (chunkRange.length == 1) {
                chunkData[firstChunk] = buffer;
                this.chunks.set(firstChunk, new DataView(buffer));

                continue;
            }

            const rootOffset = firstChunk * this.chunkSize;
            for (const chunkId of chunkRange) {
                const chunkOffset = chunkId * this.chunkSize - rootOffset;
                const chunkBuffer = buffer.slice(chunkOffset, chunkOffset + this.chunkSize);
                chunkData[chunkId] = chunkBuffer;
                this.chunks.set(chunkId, new DataView(chunkBuffer));
            }
        }

        // These are extra chunks that were fetched, so lets prime the cache
        for (const chunkId of ranges.blankFill) this.chunks.set(chunkId, new DataView(chunkData[chunkId]));

        return chunkData;
    }

    async loadBytes(offset: number, length: number, log?: LogType): Promise<void> {
        const startChunk = Math.floor(offset / this.chunkSize);
        const endChunk = Math.ceil((offset + length) / this.chunkSize) - 1;

        console.log('loadBytes', { offset, length, startChunk, endChunk, size: this.chunkSize });
        for (let i = startChunk; i <= endChunk; i++) this.toFetch.add(i);

        // Queue a fetch
        if (this.toFetchPromise == null) {
            this.toFetchPromise = new Promise<void>((resolve) => setImmediate(resolve)).then(() => this.fetchData(log));
        }

        if (this.toFetch.size > this.maxConcurrentRequests) throw new Error('Too many outstanding requests');

        await this.toFetchPromise;
    }
    getChunkId(offset: number): ChunkId {
        return Math.floor(offset / this.chunkSize) as ChunkId;
    }

    uint(offset: number, bs: ByteSize): number {
        switch (bs) {
            case ByteSize.UInt8:
                return this.uint8(offset);
            case ByteSize.UInt16:
                return this.uint16(offset);
            case ByteSize.UInt32:
                return this.uint32(offset);
            case ByteSize.UInt64:
                return this.uint64(offset);
        }
    }

    /**
     * Read a Uint8 at the offset
     * @param offset Offset relative to the view
     */
    uint8(offset: number): number {
        const chunkId = this.getChunkId(offset);
        const chunk = this.getView(chunkId);
        return chunk.getUint8(offset - chunkId * this.chunkSize);
    }

    /** Read a UInt16 at the offset */
    uint16(offset: number): number {
        const chunkId = this.isOneChunk(offset, ByteSize.UInt8);
        if (chunkId != null) {
            const chunk = this.getView(chunkId);
            return chunk.getUint16(offset - chunkId * this.chunkSize, this.isLittleEndian);
        }

        const intA = this.uint8(offset);
        const intB = this.uint8(offset + ByteSize.UInt8);
        if (this.isLittleEndian) return intA + (intB << 8);
        return (intA << 8) + intB;
    }

    /** Read a UInt32 at the offset */
    uint32(offset: number): number {
        // If all the data is contained inside one Chunk, Load the bytes directly
        const chunkId = this.isOneChunk(offset, ByteSize.UInt32);
        if (chunkId != null) {
            const chunk = this.getView(chunkId);
            return chunk.getUint32(offset - chunkId * this.chunkSize, this.isLittleEndian);
        }

        const intA = this.uint8(offset);
        const intB = this.uint8(offset + 1);
        const intC = this.uint8(offset + 2);
        const intD = this.uint8(offset + 3);
        if (this.isLittleEndian) return intA + (intB << 8) + (intC << 16) + (intD << 24);
        return (intA << 24) + (intB << 16) + (intC << 8) + intD;
    }

    /**
     * Read a uint64 at the offset
     *
     * This is not precise for large numbers
     * TODO look at bigint for offsets
     * @param offset offset to read
     */
    uint64(offset: number): number {
        // If all the data is contained inside one Chunk, Load the bytes directly
        const chunkId = this.isOneChunk(offset, ByteSize.UInt64);
        if (chunkId != null) {
            const chunk = this.getView(chunkId);
            return Number(chunk.getBigUint64(offset - chunkId * this.chunkSize, this.isLittleEndian));
        }

        const intA = this.uint32(offset);
        const intB = this.uint32(offset + ByteSize.UInt32);
        if (this.isLittleEndian) return intA + intB * POW_32; // Shifting by 32 is bad
        return intA * POW_32 + intB;
    }

    /**
     * Read a byte array at the offset
     * @param offset offset to read from
     * @param count number of bytes to read
     */
    bytes(offset: number, count: number): Uint8Array {
        const firstChunkId = this.isOneChunk(offset, count);
        if (firstChunkId) {
            const chunk = this.getView(firstChunkId);
            const startOffset = offset - firstChunkId * this.chunkSize;
            return new Uint8Array(chunk.buffer.slice(startOffset, startOffset + count));
        }

        const output = new Uint8Array(count);
        const endOffset = offset + count;

        const startChunk = Math.floor(offset / this.chunkSize);
        const endChunk = Math.ceil((offset + count) / this.chunkSize) - 1;
        let outputOffset = 0;
        for (let chunkId = startChunk; chunkId <= endChunk; chunkId++) {
            const startRead = offset + outputOffset;
            const chunkOffset = chunkId * this.chunkSize;
            const view = this.getView(chunkId as ChunkId);
            const endRead = Math.min(endOffset, chunkOffset + this.chunkSize);
            const chunkBuffer = view.buffer.slice(startRead - chunkOffset, endRead - chunkOffset);
            output.set(new Uint8Array(chunkBuffer), outputOffset);
            outputOffset += chunkBuffer.byteLength;
        }

        return output;
    }

    /**
     * Get the chunk for the given id
     * @param chunkId id of the chunk to get
     */
    getView(chunkId: ChunkId): DataView {
        const view = this.chunks.get(chunkId);
        if (view == null) throw new Error(`Chunk:${chunkId} is not ready`);
        return view;
    }

    /**
     * Determine if the number of bytes are included in a single chunk
     *
     * @returns chunkId if the data is contained inside one chunk otherwise null.
     */
    isOneChunk(offset: number, byteCount: number): ChunkId | null {
        const startChunk = Math.floor(offset / this.chunkSize);
        const endChunk = Math.floor((offset + byteCount) / this.chunkSize);
        if (endChunk - startChunk < 1) return Math.floor(startChunk) as ChunkId;
        return null;
    }

    /** Check if the number of bytes has been cached so far */
    hasBytes(offset: number, length = 1): boolean {
        const startChunk = Math.floor(offset / this.chunkSize);
        const endChunk = Math.ceil((offset + length) / this.chunkSize) - 1;
        for (let chunkId = startChunk; chunkId <= endChunk; chunkId++) {
            if (!this.chunks.has(chunkId)) return false;
        }
        return true;
    }
}
