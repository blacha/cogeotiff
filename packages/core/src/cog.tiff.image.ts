import { CogTiff } from './cog.tiff';
import { CogTiffImageTiled } from './cog.tiff.image.tiled';
import { TiffCompression } from './const/tiff.mime';
import { TiffTag } from './const/tiff.tag.id';
import { CogTiffTagBase } from './read/tag/tiff.tag.base';
import { CogTiffTag } from './read/tiff.tag';
import { Size } from './vector';

export class CogTiffImage {
    /** All IFD tags that have been read for the image */
    tags: Map<TiffTag, CogTiffTagBase>;

    /** Id of the tif image, generally the image index inside the tif */
    id: number;

    tif: CogTiff;

    constructor(tif: CogTiff, id: number, tags: Map<TiffTag, CogTiffTagBase>) {
        this.tif = tif;
        this.id = id;
        this.tags = tags;
    }

    /**
     * Get the value of a TiffTag if it exists null otherwise
     */
    value(tag: TiffTag) {
        const sourceTag = this.tags.get(tag);
        if (sourceTag == null) {
            return null;
        }
        return sourceTag.value;
    }

    protected async fetch(tag: TiffTag) {
        const sourceTag = this.tags.get(tag);
        if (sourceTag == null) {
            return null;
        }
        if (CogTiffTag.isLazy(sourceTag)) {
            return sourceTag.fetch();
        }
        return sourceTag.value;
    }

    /**
     * Get the origin point for the image
     *
     * @returns origin point of the image
     */
    get origin(): [number, number, number] {
        const tiePoints: number[] | null = this.value(TiffTag.ModelTiePoint);
        if (tiePoints == null || tiePoints.length !== 6) {
            throw new Error('Tiff image does not have a ModelTiePoint');
        }

        return [tiePoints[0], tiePoints[1], tiePoints[2]];
    }

    /**
     * Get the resolution of the image
     *
     * @returns [x,y,z] pixel scale
     */
    get resolution(): [number, number, number] {
        const modelPixelScale: number[] | null = this.value(TiffTag.ModelPixelScale);
        if (modelPixelScale == null) {
            throw new Error('Tiff image does not have a ModelPixelScale');
        }
        return [modelPixelScale[0], -modelPixelScale[1], modelPixelScale[2]];
    }

    /**
     * Bounding box of the image
     *
     * @returns [west, south, east, north] bounding box
     */
    get bbox(): [number, number, number, number] | null {
        const size = this.size;
        const origin = this.origin;
        const resolution = this.resolution;

        if (origin == null || size == null || resolution == null) {
            return null;
        }

        const x1 = origin[0];
        const y1 = origin[1];

        const x2 = x1 + resolution[0] * size.width;
        const y2 = y1 + resolution[1] * size.height;

        return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    }

    /**
     * Get the compression used by the tile
     *
     * @see TiffCompression
     *
     * @returns Compression type eg webp
     */
    get compression() {
        const compression = this.value(TiffTag.Compression);
        if (compression == null || typeof compression !== 'number') {
            return null;
        }
        return TiffCompression[compression];
    }

    /**
     * Get the size of the image
     *
     * @returns Size in pixels
     */
    get size(): Size {
        return {
            width: this.value(TiffTag.ImageWidth),
            height: this.value(TiffTag.ImageHeight),
        };
    }

    /**
     * Get the list of IFD tags that were read
     */
    get tagList(): string[] {
        return [...this.tags.keys()].map(c => TiffTag[c]);
    }

    /**
     * Determine if this image is tiled
     */
    isTiled(): this is CogTiffImageTiled {
        return this.value(TiffTag.TileWidth) !== null;
    }
}
