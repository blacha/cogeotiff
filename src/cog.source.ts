import * as ieee754 from 'ieee754';
import { CogSourceView } from './cog.source.view';
import { ByteSize } from './read/byte.size';
import { TiffVersion } from './read/tif';
import { TiffIfdEntry } from './read/tif.ifd';
import { CogSourceChunk } from './source/cog.source.chunk';
import { Logger } from './util/util.log';

const POW_32 = 2 ** 32;

export abstract class CogSource {
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

    // TODO this is not really a great way of grabbing a large
    // number of bytes, ideally we should create slices of each DataView
    // and reduce the number of function calls
    bytes(offset: number, count: number): ArrayBuffer {
        // Large fetches on the same chunk should use the buffer slice
        // to reduce the number of .unit8 calls required to make the buffer
        if (count > 8) {
            const firstChunk = this.getChunk(offset);
            const lastChunk = this.getChunk(offset + count - 1);
            if (firstChunk.id === lastChunk.id) {
                const startOffset = offset - firstChunk.offset;
                return firstChunk.view.buffer.slice(startOffset, startOffset + count)
            } else {
                // TODO it would be nice to use the same slicing across multiple buffers
                Logger.debug({ firstChunk: firstChunk.id, lastChunk: lastChunk.id }, 'Cross chunk buffer')
            }
        }

        const output = new Uint8Array(count);
        for (let i = 0; i < count; i++) {
            output[i] = this.uint8(offset + i);
        }
        return output;
    }

    float(offset: number) {
        return ieee754.read(this.bytes(offset, ByteSize.Float), 0, this.isLittleEndian, 23, 4);
    }
    double(offset: number) {
        return ieee754.read(this.bytes(offset, ByteSize.Double), 0, this.isLittleEndian, 52, 8);
    }

    // Tiff:UInt32 or BigTiff:UInt64
    pointer(offset: number) {
        return this.uint(offset, this.config.pointer);
    }

    // Tiff:UInt16 or BigTiff:UInt64
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

    async loadBytes(offset: number, count: number): Promise<void> {
        const chunks = this.getRequiredChunks(offset, count);
        await Promise.all(chunks.map(c => c.fetch));
    }

    abstract fetchBytes(offset: number, length: number): Promise<ArrayBuffer>;
    abstract name: string;
}
