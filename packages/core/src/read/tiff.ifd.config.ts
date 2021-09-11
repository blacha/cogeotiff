import { ByteSize } from '@chunkd/core';
import { TiffVersion } from '../const/tiff.version.js';

export const TagTiffConfig: TiffIfdConfig = {
    version: TiffVersion.Tiff,
    pointer: ByteSize.UInt32,
    offset: ByteSize.UInt16,
    /**
     * Each tag entry is specified as
     * UInt16:TagCode
     * UInt16:TagType
     * UInt32:TagCount
     * UInt32:Pointer To Value or value
     */
    ifd: ByteSize.UInt16 + ByteSize.UInt16 + 2 * ByteSize.UInt32,
};

export const TagTiffBigConfig: TiffIfdConfig = {
    version: TiffVersion.BigTiff,
    /** Size of most pointers */
    pointer: ByteSize.UInt64,
    /** Size of offsets */
    offset: ByteSize.UInt64,

    /**
     * Each tag entry is specified as
     * UInt16:TagCode
     * UInt16:TagType
     * UInt64:TagCount
     * UInt64:Pointer To Value or value
     */
    ifd: ByteSize.UInt16 + ByteSize.UInt16 + 2 * ByteSize.UInt64,
};

export interface TiffIfdConfig {
    version: TiffVersion;
    pointer: ByteSize;
    offset: ByteSize;
    ifd: number;
}

export const TiffIfdEntry = {
    [TiffVersion.BigTiff]: TagTiffBigConfig,
    [TiffVersion.Tiff]: TagTiffConfig,
};
