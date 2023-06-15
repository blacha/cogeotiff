import { getUint, getUint64 } from '../bytes.js';
import { CogTiff } from '../cog.tiff.js';
import { TiffTag } from '../const/tiff.tag.id.js';
import { TiffTagValueType } from '../const/tiff.tag.value.js';
import { DataViewOffset, hasBytes } from './data.view.offset.js';
import { getTiffTagSize } from './tiff.value.reader.js';

function readTagValue(
  fieldType: TiffTagValueType,
  bytes: DataView,
  offset: number,
  isLittleEndian: boolean,
): number | number[] | string | bigint {
  switch (fieldType) {
    case TiffTagValueType.Ascii:
      return String.fromCharCode(bytes.getUint8(offset));

    case TiffTagValueType.Undefined:
    case TiffTagValueType.Uint8:
      return bytes.getUint8(offset);

    case TiffTagValueType.Int8:
      return bytes.getInt8(offset);

    case TiffTagValueType.Uint16:
      return bytes.getUint16(offset, isLittleEndian);

    case TiffTagValueType.Int16:
      return bytes.getInt16(offset, isLittleEndian);

    case TiffTagValueType.Uint32:
      return bytes.getUint32(offset, isLittleEndian);

    case TiffTagValueType.Int32:
      return bytes.getInt32(offset, isLittleEndian);

    case TiffTagValueType.Rational:
      return [bytes.getUint32(offset, isLittleEndian), bytes.getUint32(offset + 4, isLittleEndian)];

    case TiffTagValueType.SignedRational:
      return [bytes.getInt32(offset, isLittleEndian), bytes.getInt32(offset + 4, isLittleEndian)];

    case TiffTagValueType.Float64:
      return bytes.getFloat64(offset, isLittleEndian);

    case TiffTagValueType.Uint64:
      return getUint64(bytes, offset, isLittleEndian);
    default:
      throw new Error(`Unknown read type "${fieldType}" "${TiffTagValueType[fieldType]}"`);
  }
}

function readValue<T>(tiff: CogTiff, bytes: DataView, offset: number, type: number, count: number): T {
  const typeSize = getTiffTagSize(type);
  const dataLength = count * typeSize;

  if (count === 1) return readTagValue(type, bytes, offset, tiff.isLittleEndian) as unknown as T;

  const output = [];
  for (let i = 0; i < dataLength; i += typeSize) {
    output.push(readTagValue(type, bytes, offset + i, tiff.isLittleEndian));
  }

  // Convert to a string if ascii
  if (type === TiffTagValueType.Ascii) return output.join('').trim() as unknown as T;

  return output as unknown as T;
}

/**
 * Determine if all the data for the tiff tag is loaded in and use that to create the specific CogTiffTag
 *
 * @see {CogTiffTag}
 *
 * @param tiff
 * @param view Bytes to read from
 * @param offset Offset in the dataview to read a tag
 */
export function createTag(tiff: CogTiff, view: DataViewOffset, offset: number): CogTiffTag<unknown> {
  const tagId = view.getUint16(offset + 0, tiff.isLittleEndian);

  const dataType = view.getUint16(offset + 2, tiff.isLittleEndian);
  const dataCount = getUint(view, offset + 4, tiff.ifdConfig.pointer, tiff.isLittleEndian);
  const dataTypeSize = getTiffTagSize(dataType);
  const dataLength = dataTypeSize * dataCount;

  // Tag value is inline read the value
  if (dataLength <= tiff.ifdConfig.pointer) {
    const value = readValue(tiff, view, offset + 4 + tiff.ifdConfig.pointer, dataType, dataCount);
    return { type: 'inline', tiff, id: tagId, count: dataCount, dataType, value };
  }

  const dataOffset = getUint(view, offset + 4 + tiff.ifdConfig.pointer, tiff.ifdConfig.pointer, tiff.isLittleEndian);
  switch (tagId) {
    case TiffTag.TileOffsets:
    case TiffTag.TileByteCounts:
    case TiffTag.StripByteCounts:
    case TiffTag.StripOffsets:
      const tag = new TagOffset(tiff, tagId, dataCount, dataType, dataOffset);
      // Some offsets are quite long and don't need to read them often, so only read the tags we are interested in when we need to
      if (hasBytes(view, dataOffset, dataLength)) tag.setBytes(view);
      return tag;
  }

  // If we already have the bytes in the view read them in
  if (hasBytes(view, dataOffset, dataLength)) {
    const value = readValue(tiff, view, dataOffset - view.sourceOffset, dataType, dataCount);
    return { type: 'inline', tiff, id: tagId, count: dataCount, dataType, value };
  }

  return new TagLazy(tiff, tagId, dataCount, dataType, dataOffset);
}

export type CogTiffTag<T = unknown> = TagLazy<T> | TagInline<T> | TagOffset;

export class TagLazy<T> {
  type = 'lazy' as const;
  id: number;
  value: T | undefined;
  tiff: CogTiff;
  dataOffset: number;
  count: number;
  dataType: number;

  constructor(tiff: CogTiff, tagId: number, count: number, type: number, offset: number) {
    this.id = tagId;
    // this.name = TiffTag[tagId];
    this.tiff = tiff;
    this.dataOffset = offset;
    this.count = count;
    this.dataType = type;
  }

  async fetch(): Promise<T> {
    if (this.value != null) return this.value;
    const dataTypeSize = getTiffTagSize(this.dataType);
    const dataLength = dataTypeSize * this.count;
    const bytes = await this.tiff.source.fetchBytes(this.dataOffset, dataLength);
    const view = new DataView(bytes);
    this.value = readValue(this.tiff, view, 0, this.dataType, this.count);
    return this.value as T;
  }
}

export interface TagInline<T> {
  type: 'inline';
  value: T;
  id: number;
  count: number;
  tiff: CogTiff;
  dataType: number;
}

export class TagOffset {
  type = 'offset' as const;
  value: number[] = [];
  id: number;
  tiff: CogTiff;
  count: number;
  isLoaded = false;
  dataType: number;
  dataOffset: number;
  view?: DataViewOffset;

  constructor(tiff: CogTiff, tagId: number, count: number, type: number, offset: number) {
    this.id = tagId;
    this.tiff = tiff;
    this.count = count;
    this.dataType = type;
    this.dataOffset = offset;
  }

  // fromBytes(view: DataViewOffset): void {
  //   const value = readValue(this.tiff, view, this.dataOffset - view.sourceOffset, this.dataType, this.count) as
  //     | number[]
  //     | number;
  //   this.value = Array.isArray(value) ? value : [value];
  // }

  setBytes(view: DataViewOffset): void {
    const dataTypeSize = getTiffTagSize(this.dataType);
    const startBytes = view.byteOffset + this.dataOffset - view.sourceOffset;
    this.view = new DataView(view.buffer.slice(startBytes, startBytes + dataTypeSize * this.count)) as DataViewOffset;

    this.view.sourceOffset = this.dataOffset;
  }

  async getValueAt(index: number): Promise<number> {
    if (index > this.count || index < 0) throw new Error('TagOffset: out of bounds :' + index);
    if (this.value[index] != null) return this.value[index];
    const dataTypeSize = getTiffTagSize(this.dataType);

    if (this.view == null) {
      const bytes = await this.tiff.source.fetchBytes(this.dataOffset + index * dataTypeSize, dataTypeSize);
      const view = new DataView(bytes);
      const value = readValue(this.tiff, view, 0, this.dataType, 1) as number;
      this.value[index] = value;
      return value;
    }

    const value = readValue(this.tiff, this.view, index * dataTypeSize, this.dataType, 1) as number;
    this.value[index] = value;
    return value;
  }
}
