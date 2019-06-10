import { TIFF_TAG_TYPE, getTiffTagSize, getTiffTagReader } from "./tif";

export abstract class CogSource {

    /** Default size to fetch in one go */
    static CHUNK_SIZE = 256 * 1024;

    _chunkSize = CogSource.CHUNK_SIZE;
    _chunks: CogSourceChunk[] = []
    isLittleEndian = true;

    /** Read a UInt16 at the offset */
    async uint16(offset: number) {
        const buff = await this.getInternalBuffer(offset, 2);
        return new DataView(buff).getUint16(0, this.isLittleEndian);
    }
    /** Read a UInt32 at the offset */
    async uint32(offset: number) {
        const buff = await this.getInternalBuffer(offset, 4);
        return new DataView(buff).getUint32(0, this.isLittleEndian);
    }

    /** Read a array of bytes at the offset */
    async getBytes(offset: number, count: number): Promise<ArrayBuffer> {
        return await this.getInternalBuffer(offset, count);
    }

    getRequiredChunks(offset: number, count: number) {
        const startChunk = Math.floor(offset / this._chunkSize);
        const endChunk = Math.floor((offset + count) / this._chunkSize);
        if (startChunk == endChunk) {
            return [startChunk];
        }
        const output = []
        for (let i = startChunk; i <= endChunk; i++) {
            output.push(i);
        }
        return output;
    }

    async readTiffType(rawOffset: number, type: TIFF_TAG_TYPE, count: number): Promise<number | number[] | number[][]> {
        const fieldLength = getTiffTagSize(type);
        const fieldSize = fieldLength * count;
        const raw = await this.getInternalBuffer(rawOffset, fieldSize);
        const dataView = new DataView(raw);

        const convert = getTiffTagReader(type);

        if (count == 1) {
            return convert(dataView, 0, this.isLittleEndian)
        }

        const output = [];
        for (let i = 0; i < fieldSize; i += fieldLength) {
            output.push(convert(dataView, i, this.isLittleEndian));
        }

        return output;
    }

    /** Check if the number of bytes has been cached so far */
    hasBytes(offset: number, count = 1) {
        const requiredChunks = this.getRequiredChunks(offset, count);
        for (const id of requiredChunks) {
            if (this._chunks[id] == null || !this._chunks[id].isReady) {
                return false;
            }
        }
        return true;
    }

    protected async getInternalBuffer(offset: number, count: number): Promise<ArrayBuffer> {
        const requiredChunks = this.getRequiredChunks(offset, count);
        const chunkFetches: Promise<CogSourceChunk>[] = [];
        for (const chunkId of requiredChunks) {
            if (this._chunks[chunkId] == null) {
                this._chunks[chunkId] = new CogSourceChunk(this, chunkId)
            }
            chunkFetches.push(this._chunks[chunkId].ready);
        }

        const chunks = await Promise.all(chunkFetches);
        if (chunks.length === 1) {
            return chunks[0].getBytes(offset, count)
        }
        // WIP need to unit test this
        // Merge chunks into one buffer so that is can be read
        const newBuff = new Uint8Array(count);
        let byteOffset = 0;
        for (const chunk of chunks) {
            const readStart = Math.max(offset, chunk.offset)
            const readEnd = Math.min(chunk.offsetEnd, offset + count)
            const chunkBytes = chunk.getBytes(readStart, readEnd - readStart)
            newBuff.set(new Uint8Array(chunkBytes), byteOffset);
            byteOffset += chunkBytes.byteLength;
        }
        return newBuff.buffer;
    }

    abstract fetchBytes(offset: number, length: number): Promise<ArrayBuffer>
}

export class CogSourceChunk {
    source: CogSource;
    id: number;
    ready: Promise<CogSourceChunk>;
    buffer: ArrayBuffer; // Often is null, best to wait for ready promise

    constructor(source: CogSource, id: number) {
        this.source = source;
        this.id = id;
        this.ready = new Promise(async resolve => {
            this.buffer = await this.source.fetchBytes(id * this.source._chunkSize, this.source._chunkSize);
            resolve(this);
        })
    }

    get isReady() {
        return this.buffer != null;
    }

    get offset() {
        return this.id * this.source._chunkSize
    }

    get offsetEnd() {
        return this.offset + this.buffer.byteLength;
    }

    get length() {
        return this.buffer.byteLength;
    }

    getBytes(offset: number, count: number): ArrayBuffer {
        const startByte = offset - this.offset;
        const endByte = startByte + count;
        if (endByte > this.buffer.byteLength) {
            throw new Error(`Read overflow ${endByte} > ${this.buffer.byteLength}`);
        }
        return this.buffer.slice(startByte, endByte)
    }
}
