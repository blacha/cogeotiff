import { TiffVersion } from "./cog.tif";
import { getTiffTagValueReader, getTiffTagSize, TiffTag, TiffTagValueType } from "./tif";

export enum ByteSize {
    UInt8 = 1,
    UInt16 = 2,
    UInt32 = 4,
    UInt64 = 8
}



const TagTiffConfig = {
    version: TiffVersion.Tiff,
    pointer: ByteSize.UInt32,
    offset: ByteSize.UInt16,
    /** Size of a IFD Entry */
    ifd: ByteSize.UInt16 + ByteSize.UInt16 + 2 * ByteSize.UInt32,
    /**
     * Each tag entry is specified as
     * UInt16:TagCode
     * UInt16:TagType
     * UInt32:TagCount
     * UInt32:Pointer To Value or value
     */
    parseIfd: async (source: CogSource, offset: number, isLittleEndian: boolean) => {
        const buff = await source.getBytes(offset, TagTiffConfig.ifd)
        const view = new DataView(buff);
        return {
            code: view.getUint16(0, isLittleEndian),
            type: view.getUint16(2, isLittleEndian),
            count: view.getUint32(4, isLittleEndian),
            valueOffset: offset + 8,
            size: TagTiffConfig.ifd
        }
    }

}
const TagTiffBigConfig = {
    version: TiffVersion.BigTiff,
    /** Size of most pointers */
    pointer: ByteSize.UInt64,
    /** Size of offsets */
    offset: ByteSize.UInt64,

    /**
     * Each tag entry is specified as
     * UInt16:TagCode
     * UInt16:TagType
     * UInt64:TagCount
     * UInt64:Pointer To Value or value
     */
    ifd: ByteSize.UInt16 + ByteSize.UInt16 + 2 * ByteSize.UInt64,
    parseIfd: async (source: CogSource, offset: number, isLittleEndian: boolean) => {
        const buff = await source.getBytes(offset, TagTiffBigConfig.ifd)
        const view = new DataView(buff);
        return {
            code: view.getUint16(0, isLittleEndian),
            type: view.getUint16(2, isLittleEndian),
            count: CogSource.uint64(view, 4, isLittleEndian),
            valueOffset: offset + 12,
            size: TagTiffBigConfig.ifd
        }
    }

}

const TiffIfdEntry = {
    [TiffVersion.BigTiff]: TagTiffBigConfig,
    [TiffVersion.Tiff]: TagTiffConfig
}

export abstract class CogSource {

    /** Default size to fetch in one go */
    static CHUNK_SIZE = 16 * 1024;

    _chunkSize = CogSource.CHUNK_SIZE;
    _chunks: CogSourceChunk[] = []

    isLittleEndian = true;
    config = TiffIfdEntry[TiffVersion.Tiff];

    setVersion(version: TiffVersion) {
        this.config = TiffIfdEntry[version];
    }

    /** Read a UInt8 at the offset */
    async uint8(offset: number) {
        const buff = await this.getInternalBuffer(offset, ByteSize.UInt8);
        return buff[0];
    }

    /** Read a UInt16 at the offset */
    async uint16(offset: number) {
        const buff = await this.getInternalBuffer(offset, ByteSize.UInt16);
        return new DataView(buff).getUint16(0, this.isLittleEndian);
    }

    /** Read a UInt32 at the offset */
    async uint32(offset: number) {
        const buff = await this.getInternalBuffer(offset, ByteSize.UInt32);
        return new DataView(buff).getUint32(0, this.isLittleEndian);
    }

    // TODO this could be not very precise for big numbers
    // Possibly look at bigint for offsets
    async uint64(offset: number) {
        const buff = await this.getInternalBuffer(offset, ByteSize.UInt64);
        const view = new DataView(buff);
        return CogSource.uint64(view, 0, this.isLittleEndian);
    }

    static uint64(view: DataView, offset: number, isLittleEndian: boolean) {
        const intA = view.getUint32(offset, isLittleEndian);
        const intB = view.getUint32(offset + 4, isLittleEndian);
        if (isLittleEndian) {
            return (intA << 32) | intB // Shifting by 32 is bad
        }
        return (intB << 32) | intA
    }

    async uint(offset: number, bs: ByteSize) {
        switch (bs) {
            case ByteSize.UInt8:
                return this.uint8(offset)
            case ByteSize.UInt16:
                return this.uint16(offset);
            case ByteSize.UInt32:
                return this.uint32(offset)
            case ByteSize.UInt64:
                return this.uint64(offset)
        }
    }

    async tag(offset: number) {
        const tag = await this.config.parseIfd(this, offset, this.isLittleEndian);
        const typeSize = getTiffTagSize(tag.type);
        const typeLength = tag.count * typeSize;

        let value = null;
        if (this.hasBytes(tag.valueOffset, typeLength)) {
            value = await this.readTiffTagValue(tag.valueOffset, tag.type, tag.count)
        } else {
            value = () => this.readTiffTagValue(tag.valueOffset, tag.type, tag.count)
        }
        return {
            ...tag,
            codeName: TiffTag[tag.code],
            typeSize,
            value,
            typeLength: tag.count * typeSize
        }
    }

    // Tiff:UInt32 or BigTiff:UInt64
    async pointer(offset: number) {
        return this.uint(offset, this.config.pointer);
    }

    // Tiff:UInt16 or BigTiff:UInt64
    async offset(offset: number) {
        return this.uint(offset, this.config.offset);
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

    async readTiffTagValue(offset: number, type: TiffTagValueType, tagCount: number): Promise<string | bigint | number | number[] | number[][]> {
        const fieldLength = getTiffTagSize(type);
        const fieldSize = fieldLength * tagCount;

        // Field is too big to be stored at the offset
        // so the offset is a pointer to where it is really stored
        if (fieldSize > this.config.pointer) {
            offset = await this.pointer(offset);
        }

        const bytes = await this.getInternalBuffer(offset, fieldSize);
        const view = new DataView(bytes);

        const convert = getTiffTagValueReader(type);

        if (tagCount == 1) {
            return convert(view, 0, this.isLittleEndian)
        }

        const output = [];
        for (let i = 0; i < fieldSize; i += fieldLength) {
            output.push(convert(view, i, this.isLittleEndian));
        }

        // Convert to a string if ascii
        if (type === TiffTagValueType.ASCII) {
            return output.join('').trim();
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
    abstract name: string;
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
