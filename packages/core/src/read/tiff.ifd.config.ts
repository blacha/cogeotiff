import { ByteSize } from '../const/byte.size';
import { TiffVersion } from '../const/tiff.version';

export const TagTiffConfig = {
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

export const TagTiffBigConfig = {
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

export const TiffIfdEntry = {
    [TiffVersion.BigTiff]: TagTiffBigConfig,
    [TiffVersion.Tiff]: TagTiffConfig,
};
