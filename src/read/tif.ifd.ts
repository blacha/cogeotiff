import { CogSource } from "../cog.source";
import { TiffVersion } from "./tif";
import { ByteSize } from "./byte.size";


const TagTiffConfig = {
    version: TiffVersion.Tiff,
    pointer: ByteSize.UInt32,
    offset: ByteSize.UInt16,
    /** Size of a IFD Entry */
    ifd: ByteSize.UInt16 + ByteSize.UInt16 + 2 * ByteSize.UInt32,
    /**
     * Each tag entry is specified as
     * UInt16:TagCode
     * UInt16:TagType
     * UInt32:TagCount
     * UInt32:Pointer To Value or value
     */
    parseIfd: async (source: CogSource, offset: number, isLittleEndian: boolean) => {
        const buff = await source.getBytes(offset, TagTiffConfig.ifd)
        const view = new DataView(buff);
        return {
            code: view.getUint16(0, isLittleEndian),
            type: view.getUint16(2, isLittleEndian),
            count: view.getUint32(4, isLittleEndian),
            valueOffset: offset + 8,
            size: TagTiffConfig.ifd
        }
    }

}
const TagTiffBigConfig = {
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
    parseIfd: async (source: CogSource, offset: number, isLittleEndian: boolean) => {
        const buff = await source.getBytes(offset, TagTiffBigConfig.ifd)
        const view = new DataView(buff);
        return {
            code: view.getUint16(0, isLittleEndian),
            type: view.getUint16(2, isLittleEndian),
            count: CogSource.uint64(view, 4, isLittleEndian),
            valueOffset: offset + 12,
            size: TagTiffBigConfig.ifd
        }
    }

}

export const TiffIfdEntry = {
    [TiffVersion.BigTiff]: TagTiffBigConfig,
    [TiffVersion.Tiff]: TagTiffConfig
}
