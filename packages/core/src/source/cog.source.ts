import * as ieee754 from 'ieee754';
import { ByteSize } from '../const/byte.size';
import { TiffVersion } from '../const/tiff.version';
import { TiffIfdEntry } from '../read/tiff.ifd.config';
import { CogChunk } from './cog.chunk';
import { CogSourceView } from './cog.source.view';

/** Shifting `<< 32` does not work in javascript */
const POW_32 = 2 ** 32;

export abstract class CogSource {
    /** Type of the source, should be unique across all source types */
    abstract type: string;

    /** Split the Tif into chunks to be read  */
    abstract chunkSize: number;

    // TODO this should ideally be a LRU
    // With a priority for the first few chunks (Generally where the main IFD resides)
    chunks: CogChunk[] = [];

    /** Is the source in little endian */
    isLittleEndian = true;
    /** Version type of the tiff, either BigTif or Tif */
    version = TiffVersion.Tiff;

    setVersion(version: TiffVersion) {
        this.version = version;
    }

    /**
     * Configuration for the tif reader, byte offsets for reading the IFD
     */
    get config() {
        return TiffIfdEntry[this.version];
    }

    /**
     * Get the list of chunks that have been read
     */
    get chunksRead(): string[] {
        return Object.keys(this.chunks).filter(f => this.chunk(parseInt(f, 10)).isReady());
    }

    /**
     * Determine if the number of bytes are included in a single chunk
     *
     * @returns chunkId if the data is contained inside one chunk otherwise null.
     */
    private isOneChunk(offset: number, byteCount: ByteSize): number | null {
        const chunkSize = this.chunkSize;
        const startChunk = offset / chunkSize;
        const endChunk = (offset + byteCount) / chunkSize;
        if (endChunk - startChunk < 1) {
            return Math.floor(startChunk);
        }
        return null;
    }

    /**
     * Read a Uint8 at the offset
     * @param offset Offset relative to the view
     */
    uint8(offset: number): number {
        const chunk = this.getChunk(offset);
        return chunk.view.getUint8(offset - chunk.offset);
    }

    /** Read a UInt16 at the offset */
    uint16(offset: number): number {
        const chunkId = this.isOneChunk(offset, ByteSize.UInt8);
        if (chunkId != null) {
            const chunk = this.chunk(chunkId);
            return chunk.view.getUint16(offset - chunk.offset, this.isLittleEndian);
        }

        const intA = this.uint8(offset);
        const intB = this.uint8(offset + ByteSize.UInt8);
        if (this.isLittleEndian) {
            return intA + (intB << 8);
        }
        return (intA << 8) + intB;
    }

    /** Read a UInt32 at the offset */
    uint32(offset: number): number {
        // If all the data is contained inside one Chunk, Load the bytes directly
        const chunkId = this.isOneChunk(offset, ByteSize.UInt32);
        if (chunkId != null) {
            const chunk = this.chunk(chunkId);
            return chunk.view.getUint32(offset - chunk.offset, this.isLittleEndian);
        }

        const intA = this.uint8(offset);
        const intB = this.uint8(offset + 1);
        const intC = this.uint8(offset + 2);
        const intD = this.uint8(offset + 3);
        if (this.isLittleEndian) {
            return intA + (intB << 8) + (intC << 16) + (intD << 24);
        }
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
            const chunk = this.chunk(chunkId);
            return Number(chunk.view.getBigUint64(offset - chunk.offset, this.isLittleEndian));
        }

        const intA = this.uint32(offset);
        const intB = this.uint32(offset + ByteSize.UInt32);
        if (this.isLittleEndian) {
            return intA + intB * POW_32; // Shifting by 32 is bad
        }
        return intA * POW_32 + intB;
    }

    /**
     * Read a byte array at the offset
     * @param offset offset to read from
     * @param count number of bytes to read
     */
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
            const chunkBuffer = chunk.buffer.slice(startRead - chunk.offset, endRead - chunk.offset);
            output.set(new Uint8Array(chunkBuffer), outputOffset);
            outputOffset += chunkBuffer.byteLength;
        }

        return output;
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

    /**
     * Get the chunk with a given chunkId
     *
     * @param chunkId id of the chunk to get
     */
    chunk(chunkId: number) {
        let chunk = this.chunks[chunkId];
        if (chunk == null) {
            chunk = this.chunks[chunkId] = new CogChunk(this, chunkId);
        }
        return chunk;
    }

    /** Read a array of bytes at the offset */
    getView(offset: number, count: number = -1): CogSourceView {
        return new CogSourceView(this, offset);
    }

    /**
     * Determine the required chunks for a given request
     * @param offset starting byte offset
     * @param count number of bytes to read
     */
    getRequiredChunks(offset: number, count: number): CogChunk[] {
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
        const promises: Promise<any>[] = [];
        for (const chunk of chunks) {
            promises.push(chunk.fetch());
        }
        await Promise.all(promises);
    }

    /**
     * Load the required bytes from the source
     *
     * @param offset byte offset to start loading from
     * @param count  number of bytes required
     */
    abstract fetchBytes(offset: number, count: number): Promise<ArrayBuffer>;
    /**
     * Name of the source, generally information like filename or url
     */
    abstract name: string;
}
