import { CogTifTag } from './read/cog.tif.tag';
import { TiffCompression, TiffTag } from './read/tif';
import { Size } from './@types/vector';

export class CogTifImage {
    tags: Map<TiffTag, CogTifTag<any>> = new Map();
    id: number;
    offset: number;

    constructor(id: number, offset: number) {
        this.id = id;
        this.offset = offset;
    }

    /** Get the value of the tag if it exists null otherwise */
    value(tag: TiffTag) {
        const sourceTag = this.tags.get(tag);
        if (sourceTag == null) {
            return null;
        }
        return sourceTag.value;
    }

    async fetch(tag: TiffTag) {
        const sourceTag = this.tags.get(tag);
        if (sourceTag == null) {
            return null;
        }
        return sourceTag.fetch;
    }

    get origin(): number[] {
        const tiePoints: number[] | null = this.value(TiffTag.ModelTiepoint);
        if (tiePoints == null || tiePoints.length !== 6) {
            throw new Error('Tiff image does not have a ModelTiepoint');
        }

        return tiePoints.slice(3);
    }

    get resolution(): number[] {
        const modelPixelScale: number[] | null = this.value(TiffTag.ModelPixelScale);
        if (modelPixelScale == null) {
            throw new Error('Tiff image does not have a ModelPixelScale');
        }
        return [modelPixelScale[0], -modelPixelScale[1], modelPixelScale[2]];
    }

    get bbox() {
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
    isTiled() {
        return this.value(TiffTag.TileWidth) !== null;
    }

    /**
     * Get tiling information
     */
    get tileInfo(): Size {
        return {
            width: this.value(TiffTag.TileWidth),
            height: this.value(TiffTag.TileHeight),
        };
    }

    get tileCount() {
        const size = this.size;
        const tileInfo = this.tileInfo;
        const nx = Math.ceil(size.width / tileInfo.width);
        const ny = Math.ceil(size.height / tileInfo.height);
        return { nx, ny, total: nx * ny };
    }
}
