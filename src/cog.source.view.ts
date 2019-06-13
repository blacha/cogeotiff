import { CogSource } from "./cog.source";
import { ByteSize } from "./read/byte.size";
import * as ieee754 from 'ieee754';

export class CogSourceView {
    source: CogSource;
    byteOffset: number;
    relativeOffset: number;

    constructor(source: CogSource, offset = 0) {
        this.source = source;
        this.byteOffset = offset;
        this.relativeOffset = 0;
    }

    get currentOffset() {
        return this.byteOffset + this.relativeOffset
    }

    /**
     * @param count number of bytes to move
     * @returns the offset that we seeked from
     */
    seek(count: number) {
        const startOffset = this.currentOffset;
        this.relativeOffset += count;
        return startOffset;
    }

    bytes(count: number) { return this.source.bytes(this.seek(count), count) }
    uint8() { return this.source.uint8(this.seek(ByteSize.UInt8)) }
    uint16() { return this.source.uint16(this.seek(ByteSize.UInt16)) }
    uint32() { return this.source.uint32(this.seek(ByteSize.UInt32)) }
    uint64() { return this.source.uint64(this.seek(ByteSize.UInt64)) }
    pointer() { return this.source.pointer(this.seek(this.source.config.pointer)) }
    offset() { return this.source.offset(this.seek(this.source.config.offset)) }
    float() { return this.source.float(this.seek(ByteSize.Float)) }
    double() { return this.source.double(this.seek(ByteSize.Double)) }

    bytesAt(offset: number, count: number) { return this.source.bytes(this.byteOffset + offset, count) }
    uint8At(offset: number) { return this.source.uint8(this.byteOffset + offset) }
    uint16At(offset: number) { return this.source.uint16(this.byteOffset + offset) }
    uint32At(offset: number) { return this.source.uint32(this.byteOffset + offset) }
    uint64At(offset: number) { return this.source.uint64(this.byteOffset + offset) }
    pointerAt(offset: number) { return this.source.pointer(this.byteOffset + offset) }
    offsetAt(offset: number) { return this.source.offset(this.byteOffset + offset) }
    floatAt(offset: number) { return this.source.float(this.byteOffset + offset) }
    doubleAt(offset: number) { return this.source.double(this.byteOffset + offset) }
}

