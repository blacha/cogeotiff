import { ByteSize } from '../util/bytes.js';
import { TiffTagValueType } from '../const/tiff.tag.value.js';

export function getTiffTagSize(fieldType: TiffTagValueType): ByteSize {
  switch (fieldType) {
    case TiffTagValueType.Uint8:
    case TiffTagValueType.Ascii:
    case TiffTagValueType.Int8:
    case TiffTagValueType.Undefined:
      return 1;
    case TiffTagValueType.Uint16:
    case TiffTagValueType.Int16:
      return 2;
    case TiffTagValueType.Uint32:
    case TiffTagValueType.Int32:
    case TiffTagValueType.Float32:
      return 4;
    case TiffTagValueType.Rational:
    case TiffTagValueType.SignedRational:
    case TiffTagValueType.Float64:
    case TiffTagValueType.Uint64:
    case TiffTagValueType.Int64:
    case TiffTagValueType.Ifd8:
      return 8;
    default:
      throw new Error(`Invalid fieldType ${fieldType}`);
  }
}
