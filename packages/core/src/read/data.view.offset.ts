/** Extension to DataView that includes the offset to where in a file the view is from */
export type DataViewOffset = DataView & {
  /** Offset in the source to where this data was read from */
  sourceOffset: number;
};

/** Convert the dataview to a dataview with a offset */
export function toDataViewOffset(d: DataView, offset: number): asserts d is DataViewOffset {
  (d as DataViewOffset).sourceOffset = offset;
}

/**
 * Does a DataviewOffset include the absolute bytes of the source file
 *
 * @param view DataViewOffset to check
 * @param targetOffset the absolute offset in the file
 * @param count number of bytes to include
 */
export function hasBytes(view: DataViewOffset, targetOffset: number, count: number): boolean {
  if (targetOffset < view.sourceOffset) return false;
  if (view.sourceOffset + view.byteLength < targetOffset + count) return false;
  return true;
}
