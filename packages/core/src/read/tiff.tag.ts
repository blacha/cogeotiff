import { TiffTag } from '../const/tiff.tag.id.js';
import { TiffTagValueType } from '../const/tiff.tag.value.js';
import { DataViewOffset } from './data.view.offset.js';

/** Tiff tag interfaces */
export type Tag<T = unknown> = TagLazy<T> | TagInline<T> | TagOffset;

export interface TagBase {
  /** Id of the Tag */
  id: TiffTag;
  /** Offset in bytes to where this tag was read from */
  tagOffset: number;
  /** Number of values */
  count: number;
  /** Tiff Tag Datatype @see {TiffTagValueType} */
  dataType: TiffTagValueType;
}

/** Tiff tag value is not inline and will be loaded later when requested */
export interface TagLazy<T> extends TagBase {
  type: 'lazy';
  /** Value if loaded undefined otherwise */
  value?: T;
  /** Where in the file the value is read from */
  dataOffset: number;
}

/** Tiff tag that's value is inside the IFD and is already read */
export interface TagInline<T> extends TagBase {
  type: 'inline';
  value: T;
}

/** Tiff tag that is a list of offsets this can be partially read */
export interface TagOffset extends TagBase {
  type: 'offset';
  /** Values of the offsets this is a sparse array unless @see {TagOffset.isLoaded} is true */
  value: number[];
  /** has all the values been read */
  isLoaded: boolean;
  /** Raw buffer of the values for lazy decoding, as reading 100,000s of uint64s can take quite a long time */
  view?: DataViewOffset;
  /** Where in the file the value is read from */
  dataOffset: number;
}
