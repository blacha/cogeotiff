import { Fetchable } from '../util/util.fetchable';
import { CogSource } from './cog.source';

export interface CogSourceChunkFetched extends CogChunk {
    _buffer: ArrayBuffer;
    _view: DataView;
}

/**
 * A chunk of data inside of a COG
 */
export class CogChunk {
    source: CogSource;
    id: number;
    fetchable: Fetchable<CogChunk>;
    _buffer: ArrayBuffer | null = null; // Often is null, best to wait for ready promise
    _view: DataView | null = null;

    constructor(source: CogSource, id: number) {
        this.source = source;
        this.id = id;
        this.fetchable = new Fetchable(async () => {
            // Sometimes things will init the chunk without a fetch being needed.
            if (this._buffer != null) {
                return this;
            }

            const buffer = await this.source.fetchBytes(id * this.source.chunkSize, this.source.chunkSize);
            this.init(buffer);
            return this;
        });
    }

    /**
     * Initialize the chunk with some data
     * @param buffer initial chunk data
     */
    init(buffer: ArrayBuffer) {
        this._buffer = buffer;
        this._view = new DataView(this._buffer);
    }

    /**
     * Load the chunk data from the source
     */
    fetch(): Promise<CogChunk> {
        return this.fetchable.fetch();
    }

    /**
     * Has this chunk fetched it's data
     */
    isReady(): this is CogSourceChunkFetched {
        return this._buffer != null;
    }

    get view(): DataView {
        if (this.isReady()) {
            return this._view;
        }
        throw new Error(`Chunk:${this.id} is not ready`);
    }

    get buffer(): ArrayBuffer {
        if (this.isReady()) {
            return this._buffer;
        }
        throw new Error(`Chunk:${this.id} is not ready`);
    }

    /**
     * Tiff byte offset for this chunk
     */
    get offset() {
        return this.id * this.source.chunkSize;
    }

    /**
     * Tif byte offset that is where this chunk ends
     */
    get offsetEnd() {
        return this.offset + this.source.chunkSize;
    }

    /**
     * Number of bytes currently ready to be read
     */
    get length() {
        return this.isReady() && this._buffer.byteLength;
    }

    /**
     * Does this chunk contain the byte offset
     * @param offset
     */
    contains(offset: number) {
        if (offset < this.offset) {
            return false;
        }
        if (offset >= this.offsetEnd) {
            return false;
        }
        return true;
    }

    toString() {
        return `<Chunk:${this.id} offset:${this.offset} length:${this.length}>`;
    }
}
