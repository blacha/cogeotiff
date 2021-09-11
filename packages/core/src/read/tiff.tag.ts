import { CogTiff } from '../cog.tiff.js';
import { TiffTag } from '../const/tiff.tag.id.js';
import { CogTiffTagBase } from './tag/tiff.tag.base.js';
import { CogTiffTagLazy } from './tag/tiff.tag.lazy.js';
import { CogTiffTagOffset } from './tag/tiff.tag.offset.js';
import { CogTifTagStatic } from './tag/tiff.tag.static.js';

export const CogTiffTag = {
    /**
     * Determine if all the data for the tiff tag is loaded in and use that to create the specific CogTiffTag
     *
     * @see CogTiffTagBase
     *
     * @param source
     * @param offset
     */
    create(tiff: CogTiff, offset: number): CogTiffTagBase<unknown> {
        const tagId = tiff.source.getUint16(offset);
        if (
            tagId === TiffTag.TileOffsets ||
            tagId === TiffTag.TileByteCounts ||
            tagId === TiffTag.StripByteCounts ||
            tagId === TiffTag.StripOffsets
        ) {
            return new CogTiffTagOffset(tagId, tiff, offset);
        }

        const staticTag = new CogTifTagStatic(tagId, tiff, offset);
        if (staticTag.hasBytes) return staticTag;

        return new CogTiffTagLazy(tagId, tiff, offset);
    },

    isStatic<T>(tiffTag: CogTiffTagBase<T>): tiffTag is CogTifTagStatic<T> {
        return tiffTag instanceof CogTifTagStatic;
    },
    isLazy<T>(tiffTag: CogTiffTagBase<T>): tiffTag is CogTiffTagLazy<T> {
        return tiffTag instanceof CogTiffTagLazy;
    },
    isOffsetArray(tiffTag: CogTiffTagBase): tiffTag is CogTiffTagOffset {
        return tiffTag instanceof CogTiffTagOffset;
    },
};
