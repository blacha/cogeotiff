export type DataViewOffset = DataView & {
  /** Offset in the source to where this data was read from */
  sourceOffset: number;
};

export function toDataViewOffset(d: DataView, offset: number): asserts d is DataViewOffset {
  (d as DataViewOffset).sourceOffset = offset;
}

export function hasBytes(view: DataViewOffset, targetOffset: number, count: number): boolean {
  if (targetOffset < view.sourceOffset) return false;
  if (view.sourceOffset + view.byteLength < targetOffset + count) return false;
  return true;
}
