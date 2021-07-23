import { ByteSize } from '@chunkd/core';
import * as ieee754 from 'ieee754';
import { CogTiff } from '..';

/**
 * View of a Cog source used for reading bytes from the cog while keeping
 * track of the offset
 */
export class CogSourceCursor {
    private tiff: CogTiff;
    /** Starting offset for the view */
    byteOffset: number;
    /** number of bytes that have been read since starting */
    relativeOffset: number;

    constructor(tiff: CogTiff, offset = 0) {
        this.tiff = tiff;
        this.byteOffset = offset;
        this.relativeOffset = 0;
    }

    /** current offset after all the reads */
    get currentOffset(): number {
        return this.byteOffset + this.relativeOffset;
    }

    /** Seek to a position */
    seekTo(offset: number): CogSourceCursor {
        this.byteOffset = offset;
        this.relativeOffset = 0;
        return this;
    }

    /**
     * @param count number of bytes to move
     * @returns the offset that we seeked from
     */
    seek(count: number): number {
        const startOffset = this.currentOffset;
        this.relativeOffset += count;
        return startOffset;
    }

    bytes(count: number): Uint8Array {
        return this.tiff.source.bytes(this.seek(count), count);
    }
    uint(size: number): number {
        return this.tiff.source.uint(this.seek(size), size);
    }
    uint8(): number {
        return this.tiff.source.uint8(this.seek(ByteSize.UInt8));
    }
    uint16(): number {
        return this.tiff.source.uint16(this.seek(ByteSize.UInt16));
    }
    uint32(): number {
        return this.tiff.source.uint32(this.seek(ByteSize.UInt32));
    }
    uint64(): number {
        return this.tiff.source.uint64(this.seek(ByteSize.UInt64));
    }
    pointer(): number {
        const pointerSize = this.tiff.ifdConfig.pointer;
        return this.tiff.source.uint(this.seek(pointerSize), pointerSize);
    }
    offset(): number {
        const offsetSize = this.tiff.ifdConfig.offset;
        return this.tiff.source.uint(this.seek(offsetSize), offsetSize);
    }

    float(): number {
        return ieee754.read(this.bytes(ByteSize.Float), 0, this.tiff.source.isLittleEndian, 23, 4);
    }
    double(): number {
        return ieee754.read(this.bytes(ByteSize.Double), 0, this.tiff.source.isLittleEndian, 52, 8);
    }
}
