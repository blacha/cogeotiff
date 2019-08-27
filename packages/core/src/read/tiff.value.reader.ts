import { TiffTagValueType } from '../const/tiff.tag.value';
import { CogSource } from '../source/cog.source';

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
export type TiffTagValueReaderFunc = (
    view: CogSource,
    offset: number,
) => number | bigint | TiffTagValueRational | string;

const TiffTagValueReader: { [key: string]: TiffTagValueReaderFunc } = {
    char: (view: CogSource, offset: number) => String.fromCharCode(view.uint8(offset)),
    uint8: (view: CogSource, offset: number) => view.uint8(offset),
    uint16: (view: CogSource, offset: number) => view.uint16(offset),
    uint32: (view: CogSource, offset: number) => view.uint32(offset),
    uint64: (view: CogSource, offset: number) => view.uint64(offset),
    double: (view: CogSource, offset: number) => view.double(offset),
    rational: (view: CogSource, offset: number) => [view.uint32(offset), view.uint32(offset + 4)],
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
