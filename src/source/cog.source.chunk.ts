import { CogSource } from "../cog.source";

export class CogSourceChunk {
    source: CogSource;
    id: number;
    ready: Promise<CogSourceChunk>;
    buffer: ArrayBuffer; // Often is null, best to wait for ready promise

    constructor(source: CogSource, id: number) {
        this.source = source;
        this.id = id;
        this.ready = new Promise(async resolve => {
            this.buffer = await this.source.fetchBytes(id * this.source.chunkSize, this.source.chunkSize);
            resolve(this);
        })
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

    getBytes(offset: number, count: number): ArrayBuffer {
        const startByte = offset - this.offset;
        const endByte = startByte + count;
        // console.log(this.toString(), startByte, count, endByte, this.offsetEnd)
        if (endByte > this.buffer.byteLength) {
            throw new Error(`Read overflow ${endByte} > ${this.buffer.byteLength}`);
        }
        return this.buffer.slice(startByte, endByte)
    }

    toString() {
        return `<Chunk:${this.id} offset:${this.offset} length:${this.length}>`
    }
}
