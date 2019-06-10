import { TIFF_TAG_TYPE } from "./tif";

const BUFFER_SIZE = Math.pow(2, 5) // 32kb

export interface CogSourceBuffer {
    buffer: DataView;
    offset: number;
}

export abstract class CogSource {

    /** Default size to fetch in one go */
    static ChunkSize = 60 * 1024;
    _chunks: CogSourceChunk[] = []
    // TODO this is not really a great way of storing a sparse Buffer
    // Should refactor this to be a better buffer, it will often have duplicate data in
    _bytes: CogSourceBuffer[] = [];
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
        const startChunk = Math.floor(offset / CogSource.ChunkSize);
        const endChunk = Math.floor((offset + count) / CogSource.ChunkSize);
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
        const fieldLength = CogSource.getFieldLength(type);
        const fieldSize = fieldLength * count;
        const raw = await this.getInternalBuffer(rawOffset, fieldSize);
        const dataView = new DataView(raw);

        let convert = null;
        switch (type) {
            case TIFF_TAG_TYPE.BYTE:
            case TIFF_TAG_TYPE.ASCII:
            case TIFF_TAG_TYPE.UNDEFINED:
            case TIFF_TAG_TYPE.SBYTE:
                convert = offset => dataView.getUint8(offset)
                break;

            case TIFF_TAG_TYPE.SHORT:
            case TIFF_TAG_TYPE.SSHORT:
                convert = offset => dataView.getUint16(offset, this.isLittleEndian)
                break;

            case TIFF_TAG_TYPE.LONG:
            case TIFF_TAG_TYPE.SLONG:
                convert = offset => dataView.getUint32(offset, this.isLittleEndian)
                break;

            case TIFF_TAG_TYPE.RATIONAL:
            case TIFF_TAG_TYPE.SRATIONAL:
                convert = (offset: number) => [
                    dataView.getUint32(offset, this.isLittleEndian),
                    dataView.getUint32(offset + 4, this.isLittleEndian)
                ]
                break;

            default:
                throw new Error(`Unknown read type "${type}"`)
        }

        const output = [];
        if (convert == null) {
            throw new Error(`Unknown read type "${type}"`)
        }

        for (let i = 0; i < fieldSize; i += fieldLength) {
            output.push(convert(i));
        }
        if (count == 1) {
            return output[0];
        }

        return output;
    }

    static getFieldLength(fieldType: TIFF_TAG_TYPE) {
        switch (fieldType) {
            case TIFF_TAG_TYPE.BYTE: case TIFF_TAG_TYPE.ASCII: case TIFF_TAG_TYPE.SBYTE: case TIFF_TAG_TYPE.UNDEFINED:
                return 1;
            case TIFF_TAG_TYPE.SHORT: case TIFF_TAG_TYPE.SSHORT:
                return 2;
            case TIFF_TAG_TYPE.LONG: case TIFF_TAG_TYPE.SLONG: case TIFF_TAG_TYPE.FLOAT:
                return 4;
            case TIFF_TAG_TYPE.RATIONAL: case TIFF_TAG_TYPE.SRATIONAL: case TIFF_TAG_TYPE.DOUBLE:
            case TIFF_TAG_TYPE.LONG8: case TIFF_TAG_TYPE.SLONG8: case TIFF_TAG_TYPE.IFD8:
                return 8;
            default:
                throw new Error(`Invalid field type: "${fieldType}"`);
        }
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
    buffer: ArrayBuffer; // Often is null, best to wait for promise

    constructor(source: CogSource, id: number) {
        this.source = source;
        this.id = id;
        this.ready = new Promise(async resolve => {
            this.buffer = await this.source.fetchBytes(id * CogSource.ChunkSize, CogSource.ChunkSize);
            resolve(this);
        })
    }

    get isReady() {
        return this.buffer != null;
    }

    get offset() {
        return this.id * CogSource.ChunkSize
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
