import * as ieee754 from 'ieee754';
import { CogSourceView } from './cog.source.view';
import { ByteSize } from './read/byte.size';
import { TiffVersion } from './read/tif';
import { TiffIfdEntry } from './read/tif.ifd';
import { CogSourceChunk } from './source/cog.source.chunk';
import { Logger } from './util/util.log';
import { toHexString } from './util/util.hex';

/** Shifting `<< 32` does not work in javascript */
const POW_32 = 2 ** 32;

export abstract class CogSource {
    /** Split the Tif into chunks to be read  */
    abstract chunkSize: number;
    _chunks: CogSourceChunk[] = [];

    isLittleEndian = true;
    version = TiffVersion.Tiff;

    setVersion(version: TiffVersion) {
        this.version = version;
    }

    get config() {
        return TiffIfdEntry[this.version];
    }

    /**
     * Get the list of chunks that have been read in
     */
    get chunksRead(): string[] {
        return Object.keys(this._chunks).filter(f => this.chunk(parseInt(f, 10)).isReady());
    }

    /**
     *  @param offset Offset relative to the view
     */
    uint8(offset: number): number {
        const chunk = this.getChunk(offset);
        return chunk.view.getUint8(offset - chunk.offset);
    }

    /** Read a UInt16 at the offset */
    uint16(offset: number): number {
        const intA = this.uint8(offset);
        const intB = this.uint8(offset + ByteSize.UInt8);
        if (this.isLittleEndian) {
            return intA + (intB << 8);
        }
        return (intA << 8) + intB;
    }

    /** Read a UInt32 at the offset */
    uint32(offset: number): number {
        const intA = this.uint8(offset);
        const intB = this.uint8(offset + 1);
        const intC = this.uint8(offset + 2);
        const intD = this.uint8(offset + 3);
        if (this.isLittleEndian) {
            return intA + (intB << 8) + (intC << 16) + (intD << 24);
        }
        return (intA << 24) + (intB << 16) + (intC << 8) + intD;
    }

    // This is not precise for large numbers
    // TODO Ideally switch to bigint for offsets
    uint64(offset: number): number {
        const intA = this.uint32(offset);
        const intB = this.uint32(offset + ByteSize.UInt32);
        if (this.isLittleEndian) {
            return intA + intB * POW_32; // Shifting by 32 is bad
        }
        return intA * POW_32 + intB;
    }


    bytes(offset: number, count: number): Uint8Array {

        const firstChunk = this.getChunk(offset);

        if (firstChunk.contains(offset + count)) {
            const startOffset = offset - firstChunk.offset;
            return new Uint8Array(firstChunk.view.buffer.slice(startOffset, startOffset + count));
        }

        const output = new Uint8Array(count);
        const endOffset = offset + count;

        const chunks = this.getRequiredChunks(offset, count);
        let outputOffset = 0;
        for (const chunk of chunks) {
            const startRead = offset + outputOffset;
            const endRead = Math.min(endOffset, chunk.offsetEnd);
            const chunkBuffer = chunk.buffer.slice(startRead - chunk.offset, endRead - chunk.offset)
            output.set(new Uint8Array(chunkBuffer), outputOffset)
            outputOffset += chunkBuffer.byteLength
        }

        return output
    }

    float(offset: number) {
        return ieee754.read(this.bytes(offset, ByteSize.Float), 0, this.isLittleEndian, 23, 4);
    }
    double(offset: number) {
        return ieee754.read(this.bytes(offset, ByteSize.Double), 0, this.isLittleEndian, 52, 8);
    }

    /**
     * Fetch a pointer offset, this could be a UInt32 (Tif) or UInt64 (BigTif)
     * @param offset byte offset to fetch at
     */
    pointer(offset: number) {
        return this.uint(offset, this.config.pointer);
    }

    /**
     * Fetch a offset, this could be a UInt16 (Tif) or UInt64 (BigTif)
     * @param offset byte offset to fetch at
     */
    offset(offset: number) {
        return this.uint(offset, this.config.offset);
    }

    uint(offset: number, bs: ByteSize) {
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
     * find the chunk for the given offset
     * @param offset byte offset to get the chunk for
     */
    getChunk(offset: number) {
        return this.chunk(Math.floor(offset / this.chunkSize));
    }

    chunk(chunkId: number) {
        let chunk = this._chunks[chunkId];
        if (chunk == null) {
            chunk = this._chunks[chunkId] = new CogSourceChunk(this, chunkId);
        }
        return chunk;
    }
    // /** Read a array of bytes at the offset */
    getView(offset: number, count: number = -1): CogSourceView {
        return new CogSourceView(this, offset);
    }

    /**
     * Determine the required chunks for a given request
     * @param offset starting byte offset
     * @param count number of bytes to read
     */
    getRequiredChunks(offset: number, count: number): CogSourceChunk[] {
        const startChunk = Math.floor(offset / this.chunkSize);
        const endChunk = Math.ceil((offset + count) / this.chunkSize) - 1;

        const output = [];
        for (let chunkId = startChunk; chunkId <= endChunk; chunkId++) {
            output.push(this.chunk(chunkId));
        }
        return output;
    }

    /** Check if the number of bytes has been cached so far */
    hasBytes(offset: number, count = 1) {
        const requiredChunks = this.getRequiredChunks(offset, count);
        for (const chunk of requiredChunks) {
            if (!chunk.isReady()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Load the required bytes from the source
     *
     * @remarks
     * This will load a minimum of @see this.chunkSize amount of bytes
     * if we do not have the bytes cached
     *
     * @param offset byte offset to start loading from
     * @param count  number of bytes required
     */
    async loadBytes(offset: number, count: number): Promise<void> {
        const chunks = this.getRequiredChunks(offset, count);
        await Promise.all(chunks.map(c => c.fetch));
    }

    abstract fetchBytes(offset: number, length: number): Promise<ArrayBuffer>;
    abstract name: string;
}
