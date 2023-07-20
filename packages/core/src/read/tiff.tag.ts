import { TagId } from '../const/tiff.tag.id.js';
import { TiffTagValueType } from '../const/tiff.tag.value.js';
import { DataViewOffset } from './data.view.offset.js';

export type Tag<T = unknown> = TagLazy<T> | TagInline<T> | TagOffset;

export interface TagBase {
  /** Id of the Tag */
  id: TagId;
  /** Offset in bytes to where this tag was read from */
  tagOffset: number;
  /** Number of values */
  count: number;
  /** Tiff Tag Datatype @see {TiffTagValueType} */
  dataType: TiffTagValueType;
}

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

export interface TagOffset extends TagBase {
  type: 'offset';
  /** Values of the offest's this is a sparse array unless @see {isLoaded} is true */
  value: number[];
  /** has all the values been read */
  isLoaded?: boolean;
  /** Raw buffer of the values for lazy decoding, Reading 1000s of uint64s can take quite a while */
  view?: DataViewOffset;
  /** Where in the file the value is read from */
  dataOffset: number;
}
