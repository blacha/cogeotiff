import { ByteSize, ChunkSource } from '@chunkd/core';
import { TiffTagValueType } from '../const/tiff.tag.value.js';
import * as ieee754 from 'ieee754';

export function getTiffTagSize(fieldType: TiffTagValueType): number {
    switch (fieldType) {
        case TiffTagValueType.BYTE:
        case TiffTagValueType.ASCII:
        case TiffTagValueType.SBYTE:
        case TiffTagValueType.UNDEFINED:
            return 1;
        case TiffTagValueType.SHORT:
        case TiffTagValueType.SSHORT:
            return 2;
        case TiffTagValueType.LONG:
        case TiffTagValueType.SLONG:
        case TiffTagValueType.FLOAT:
            return 4;
        case TiffTagValueType.RATIONAL:
        case TiffTagValueType.SRATIONAL:
        case TiffTagValueType.DOUBLE:
        case TiffTagValueType.LONG8:
        case TiffTagValueType.SLONG8:
        case TiffTagValueType.IFD8:
            return 8;
        default:
            throw new Error(`Invalid fieldType ${fieldType}`);
    }
}

export type TiffTagValueRational = [number, number];
export type TiffTagValueReaderFunc = (view: ChunkSource, offset: number) => number | TiffTagValueRational | string;

const TiffTagValueReader: { [key: string]: TiffTagValueReaderFunc } = {
    char: (s: ChunkSource, offset: number) => String.fromCharCode(s.getUint8(offset)),
    uint8: (s: ChunkSource, offset: number) => s.getUint8(offset),
    uint16: (s: ChunkSource, offset: number) => s.getUint16(offset),
    uint32: (s: ChunkSource, offset: number) => s.getUint32(offset),
    uint64: (s: ChunkSource, offset: number) => s.getUint64(offset),
    double: (s: ChunkSource, offset: number) => {
        return ieee754.read(s.bytes(offset, ByteSize.Double), 0, s.isLittleEndian, 52, 8);
    },
    rational: (s: ChunkSource, offset: number) => [s.getUint32(offset), s.getUint32(offset + 4)],
};
export function getTiffTagValueReader(fieldType: TiffTagValueType): TiffTagValueReaderFunc {
    switch (fieldType) {
        case TiffTagValueType.ASCII:
            return TiffTagValueReader.char;

        case TiffTagValueType.BYTE:
        case TiffTagValueType.UNDEFINED:
        case TiffTagValueType.SBYTE:
            return TiffTagValueReader.uint8;

        case TiffTagValueType.SHORT:
        case TiffTagValueType.SSHORT:
            return TiffTagValueReader.uint16;

        case TiffTagValueType.LONG:
        case TiffTagValueType.SLONG:
            return TiffTagValueReader.uint32;

        case TiffTagValueType.RATIONAL:
        case TiffTagValueType.SRATIONAL:
            return TiffTagValueReader.rational;

        case TiffTagValueType.DOUBLE:
            return TiffTagValueReader.double;

        case TiffTagValueType.LONG8:
            return TiffTagValueReader.uint64;

        default:
            throw new Error(`Unknown read type "${fieldType}" "${TiffTagValueType[fieldType]}"`);
    }
}
