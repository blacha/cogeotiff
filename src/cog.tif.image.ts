import { TiffTag, TiffCompression } from "./read/tif";
import { CogTifTag } from "./read/cog.tif.tag";

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

    get origin() {
        const tiePoints = this.tags.get(TiffTag.ModelTiepoint);
        if (tiePoints == null) {
            return;
        }

        if (tiePoints && tiePoints.value.length === 6) {
            return tiePoints.value.slice(3)
        }
    }

    get compression() {
        return TiffCompression[this.value(TiffTag.Compression)]
    }

    get size() {
        return {
            width: this.value(TiffTag.ImageWidth),
            height: this.value(TiffTag.ImageHeight)
        }
    }

    get tagList(): string[] {
        return [...this.tags.keys()].map(c => TiffTag[c])
    }

    get tileInfo() {
        // Not tiled
        if (this.value(TiffTag.TileWidth) == null) {
            return null;
        }

        return {
            width: this.value(TiffTag.TileWidth),
            height: this.value(TiffTag.TileHeight)
        }
    }
}
