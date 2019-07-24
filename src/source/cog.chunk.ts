import { CogSource } from '../cog.source';
import { Logger } from '../util/util.log';
import { toHexString } from '../util/util.hex';
import { Fetchable } from '../util/util.fetchable';

export interface CogSourceChunkFetched extends CogChunk {
    _buffer: ArrayBuffer;
    _view: DataView;
}

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
            Logger.debug(
                { offset: toHexString(this.offset), count: toHexString(this.source.chunkSize), chunkId: this.id },
                'FetchBytes',
            );
            const buffer = await this.source.fetchBytes(id * this.source.chunkSize, this.source.chunkSize);
            this.init(buffer);
            return this;
        });
    }

    init(buffer: ArrayBuffer) {
        this._buffer = buffer;
        this._view = new DataView(this._buffer);
    }

    fetch(): Promise<CogChunk> {
        return this.fetchable.fetch();
    }

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

    get offset() {
        return this.id * this.source.chunkSize;
    }

    get offsetEnd() {
        return this.offset + this.source.chunkSize;
    }

    get length() {
        return this.isReady() && this._buffer.byteLength;
    }

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
