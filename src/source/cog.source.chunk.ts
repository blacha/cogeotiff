import { CogSource } from "../cog.source";
import { Logger } from "../util/util.log";
import { toHexString } from "../util/util.hex";
import { Fetchable } from "../util/util.fetchable";

export class CogSourceChunk {
    source: CogSource;
    id: number;
    fetchable: Fetchable<CogSourceChunk>;
    buffer: ArrayBuffer; // Often is null, best to wait for ready promise
    view: DataView;

    constructor(source: CogSource, id: number) {
        this.source = source;
        this.id = id;
        this.fetchable = new Fetchable(async () => {
            Logger.debug({ offset: toHexString(this.offset), count: toHexString(this.source.chunkSize), chunkId: this.id }, 'FetchBytes')
            const buffer = await this.source.fetchBytes(id * this.source.chunkSize, this.source.chunkSize);;
            this.init(buffer);
            return this;
        })
    }

    init(buffer: ArrayBuffer) {
        this.buffer = buffer;
        this.view = new DataView(this.buffer);
    }

    get fetch() {
        return this.fetchable.fetch;
    }

    get isReady() {
        return this.buffer != null;
    }

    get offset() {
        return this.id * this.source.chunkSize
    }

    get offsetEnd() {
        return this.offset + this.source.chunkSize;
    }

    get length() {
        return this.buffer.byteLength;
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
        return `<Chunk:${this.id} offset:${this.offset} length:${this.length}>`
    }
}
