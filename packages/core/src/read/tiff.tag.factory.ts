/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { TiffTag, TiffTagConvertArray } from '../const/tiff.tag.id.js';
import { TiffTagValueType } from '../const/tiff.tag.value.js';
import type { Tiff } from '../tiff.js';
import { getUint, getUint64 } from '../util/bytes.js';
import type { DataViewOffset } from './data.view.offset.js';
import { hasBytes } from './data.view.offset.js';
import { isLittleEndian } from './endian.js';
import type { Tag, TagLazy, TagOffset } from './tiff.tag.js';
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
    case TiffTagValueType.Ifd:
      return bytes.getUint32(offset, isLittleEndian);

    case TiffTagValueType.Int32:
      return bytes.getInt32(offset, isLittleEndian);

    case TiffTagValueType.Rational:
      return [bytes.getUint32(offset, isLittleEndian), bytes.getUint32(offset + 4, isLittleEndian)];

    case TiffTagValueType.SignedRational:
      return [bytes.getInt32(offset, isLittleEndian), bytes.getInt32(offset + 4, isLittleEndian)];

    case TiffTagValueType.Float64:
      return bytes.getFloat64(offset, isLittleEndian);

    case TiffTagValueType.Float32:
      return bytes.getFloat32(offset, isLittleEndian);

    case TiffTagValueType.Uint64:
      return getUint64(bytes, offset, isLittleEndian);
    default:
      throw new Error(`Unknown read type "${fieldType}" "${TiffTagValueType[fieldType]}"`);
  }
}

/**
 * Convert a tiff tag value to a typed array if the local endian matches the tiff endian
 *
 * @param tiff
 * @param bytes
 * @param offset Offset in the data view to read from
 * @param length Number of bytes to read
 * @param type type of tiff tag
 * @returns the value if the type is a typed array and the endianness matches otherwise null
 */
export function readTypedValue<T>(
  tiff: Tiff,
  bytes: DataView,
  offset: number,
  length: number,
  type: TiffTagValueType,
): T | null {
  switch (type) {
    case TiffTagValueType.Uint8:
      return new Uint8Array(
        bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + length),
      ) as unknown as T;
    case TiffTagValueType.Uint16:
      if (tiff.isLittleEndian !== isLittleEndian) return null;
      return new Uint16Array(
        bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + length),
      ) as unknown as T;
    case TiffTagValueType.Uint32:
      if (tiff.isLittleEndian !== isLittleEndian) return null;
      return new Uint32Array(
        bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + length),
      ) as unknown as T;
  }
  return null;
}

function readValue<T>(
  tiff: Tiff,
  tagId: TiffTag | undefined,
  bytes: DataView,
  offset: number,
  type: TiffTagValueType,
  count: number,
): T {
  const typeSize = getTiffTagSize(type);
  const dataLength = count * typeSize;

  if (count === 1) {
    const val = readTagValue(type, bytes, offset, tiff.isLittleEndian) as unknown as T;
    // Force some single values to be arrays eg BitsPerSample
    // makes it easier to not check for number | number[]
    if (tagId && TiffTagConvertArray[tagId]) return [val] as T;
    return val;
  }

  switch (type) {
    case TiffTagValueType.Ascii:
      return String.fromCharCode.apply(
        null,
        new Uint8Array(bytes.buffer, offset, dataLength - 1) as unknown as number[],
      ) as unknown as T;
  }

  // TODO should we convert all tag values to typed arrays if possible?
  if (
    tagId === TiffTag.TileOffsets ||
    tagId === TiffTag.TileByteCounts ||
    tagId === TiffTag.StripOffsets ||
    tagId === TiffTag.StripByteCounts
  ) {
    const typedOutput = readTypedValue(tiff, bytes, offset, dataLength, type);
    if (typedOutput) return typedOutput as unknown as T;
  }

  const output = [];
  for (let i = 0; i < dataLength; i += typeSize) {
    output.push(readTagValue(type, bytes, offset + i, tiff.isLittleEndian));
  }

  return output as unknown as T;
}

/**
 * Determine if all the data for the tiff tag is loaded in and use that to create the specific CogTiffTag
 *
 * @see {@link Tag}
 *
 * @param tiff
 * @param view Bytes to read from
 * @param offset Offset in the dataview to read a tag
 */
export function createTag(tiff: Tiff, view: DataViewOffset, offset: number): Tag<unknown> {
  const tagId = view.getUint16(offset + 0, tiff.isLittleEndian);

  const dataType = view.getUint16(offset + 2, tiff.isLittleEndian) as TiffTagValueType;
  const dataCount = getUint(view, offset + 4, tiff.ifdConfig.pointer, tiff.isLittleEndian);
  const dataTypeSize = getTiffTagSize(dataType);
  const dataLength = dataTypeSize * dataCount;

  // Tag value is inline read the value
  if (dataLength <= tiff.ifdConfig.pointer) {
    const value = readValue(tiff, tagId, view, offset + 4 + tiff.ifdConfig.pointer, dataType, dataCount);
    return { type: 'inline', id: tagId, name: TiffTag[tagId], count: dataCount, value, dataType, tagOffset: offset };
  }

  const dataOffset = getUint(view, offset + 4 + tiff.ifdConfig.pointer, tiff.ifdConfig.pointer, tiff.isLittleEndian);

  switch (tagId) {
    case TiffTag.TileOffsets:
    case TiffTag.TileByteCounts:
    case TiffTag.StripByteCounts:
    case TiffTag.StripOffsets:
      const tag: TagOffset = {
        type: 'offset',
        id: tagId,
        name: TiffTag[tagId],
        count: dataCount,
        dataType,
        dataOffset,
        isLoaded: false,
        value: [],
        tagOffset: offset,
      };

      if (hasBytes(view, dataOffset, dataLength)) {
        const val = readTypedValue(tiff, view, dataOffset - view.sourceOffset, dataLength, dataType);
        if (val) {
          tag.value = val as number[] | Uint32Array | Uint16Array;
          tag.isLoaded = true;
        } else {
          setBytes(tag, view);
        }
      }

      return tag;
  }

  // If we already have the bytes in the view read them in
  if (hasBytes(view, dataOffset, dataLength)) {
    const value = readValue(tiff, tagId, view, dataOffset - view.sourceOffset, dataType, dataCount);
    return { type: 'inline', id: tagId, name: TiffTag[tagId], count: dataCount, value, dataType, tagOffset: offset };
  }

  return { type: 'lazy', id: tagId, name: TiffTag[tagId], count: dataCount, dataOffset, dataType, tagOffset: offset };
}

/** Fetch the value from a {@link TagLazy} tag */
export async function fetchLazy<T>(tag: TagLazy<T>, tiff: Tiff): Promise<T> {
  if (tag.value != null) return tag.value;
  const dataTypeSize = getTiffTagSize(tag.dataType);
  const dataLength = dataTypeSize * tag.count;
  const bytes = await tiff.source.fetch(tag.dataOffset, dataLength);
  const view = new DataView(bytes);
  tag.value = readValue(tiff, tag.id, view, 0, tag.dataType, tag.count);
  return tag.value as T;
}

/**
 * Fetch all the values from a {@link TagOffset}
 */
export async function fetchAllOffsets(tiff: Tiff, tag: TagOffset): Promise<TagOffset['value']> {
  const dataTypeSize = getTiffTagSize(tag.dataType);

  if (tag.view == null) {
    const bytes = await tiff.source.fetch(tag.dataOffset, dataTypeSize * tag.count);
    tag.view = new DataView(bytes) as DataViewOffset;
    tag.view.sourceOffset = tag.dataOffset;
  }

  tag.value = readValue(tiff, tag.id, tag.view, 0, tag.dataType, tag.count);
  tag.view = undefined;
  tag.isLoaded = true;
  return tag.value;
}

export function setBytes(tag: TagOffset, view: DataViewOffset): void {
  const dataTypeSize = getTiffTagSize(tag.dataType);
  const startBytes = view.byteOffset + tag.dataOffset - view.sourceOffset;
  tag.view = new DataView(view.buffer.slice(startBytes, startBytes + dataTypeSize * tag.count)) as DataViewOffset;
  tag.view.sourceOffset = tag.dataOffset;
}

/** Partially fetch the values of a {@link TagOffset} and return the value for the offset */
export async function getValueAt(tiff: Tiff, tag: TagOffset, index: number): Promise<number> {
  if (index > tag.count || index < 0) throw new Error('TagOffset: out of bounds :' + index);
  if (tag.value[index] != null) return tag.value[index];
  const dataTypeSize = getTiffTagSize(tag.dataType);

  if (tag.view == null) {
    const bytes = await tiff.source.fetch(tag.dataOffset + index * dataTypeSize, dataTypeSize);
    const view = new DataView(bytes);
    // Skip type conversion to array by using undefined tiff tag id
    const value = readValue(tiff, undefined, view, 0, tag.dataType, 1);
    if (typeof value !== 'number') throw new Error('Value is not a number');
    tag.value[index] = value;
    return value;
  }

  // Skip type conversion to array by using undefined tiff tag id
  const value = readValue(tiff, undefined, tag.view, index * dataTypeSize, tag.dataType, 1);
  if (typeof value !== 'number') throw new Error('Value is not a number');
  tag.value[index] = value;
  return value;
}
