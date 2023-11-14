export const ByteSize = {
  Double: 8,
  Float32: 4,
  UInt64: 8,
  UInt32: 4,
  UInt16: 2,
  UInt8: 1,
} as const;
/** Shifting `<< 32` does not work in javascript */
const POW_32 = 2 ** 32;
/**
 * Read a uint64 at the offset
 *
 * This is not precise for large numbers
 * @see {DataView.getBigUint64}
 * @param offset offset to read
 */
export function getUint64(view: DataView, offset: number, isLittleEndian: boolean): number {
  // split 64-bit number into two 32-bit (4-byte) parts
  const left = view.getUint32(offset, isLittleEndian);
  const right = view.getUint32(offset + 4, isLittleEndian);

  // combine the two 32-bit values
  const combined = isLittleEndian ? left + POW_32 * right : POW_32 * left + right;

  if (!Number.isSafeInteger(combined)) {
    throw new Error(combined + ' exceeds MAX_SAFE_INTEGER. Precision may is lost');
  }

  return combined;
}

/**
 * Read a dynamic length uint from a dataview
 *
 * @param view Data to read
 * @param offset Offset at which to read
 * @param bs Size of the uint to read {@link ByteSize}
 * @param isLittleEndian Is the UInt in little endian
 * @returns
 */
export function getUint(view: DataView, offset: number, bs: number, isLittleEndian: boolean): number {
  switch (bs) {
    case ByteSize.UInt8:
      return view.getUint8(offset);
    case ByteSize.UInt16:
      return view.getUint16(offset, isLittleEndian);
    case ByteSize.UInt32:
      return view.getUint32(offset, isLittleEndian);
    case ByteSize.UInt64:
      return getUint64(view, offset, isLittleEndian);
    default:
      throw new Error(`ByteSize: ${bs} is not a UInt size`);
  }
}
