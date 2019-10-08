import { TiffTag } from '../const/tiff.tag.id';
import { CogSource } from '../source/cog.source';
import { CogTiffTagBase } from './tag/tiff.tag.base';
import { CogTiffTagLazy } from './tag/tiff.tag.lazy';
import { CogTiffTagOffset } from './tag/tiff.tag.offset';
import { CogTifTagStatic } from './tag/tiff.tag.static';

export const CogTiffTag = {
    /**
     * Determine if all the data for the tiff tag is loaded in and use that to create the specific CogTiffTag
     *
     * @see CogTiffTagBase
     *
     * @param source
     * @param offset
     */
    create(source: CogSource, offset: number) {
        const view = source.getView(offset);
        const tagId = view.uint16At(0);
        if (tagId === TiffTag.TileOffsets || tagId === TiffTag.TileByteCounts) {
            return new CogTiffTagOffset(tagId, source, offset, view);
        }

        const staticTag = new CogTifTagStatic(tagId, source, offset, view);
        if (staticTag.hasBytes) {
            return staticTag;
        }

        return new CogTiffTagLazy(tagId, source, offset, view);
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
