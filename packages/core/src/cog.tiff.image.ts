import { CogTiff } from './cog.tiff';
import { TiffCompression, TiffMimeType } from './const/tiff.mime';
import { TiffTag } from './const/tiff.tag.id';
import { CogTiffTagBase } from './read/tag/tiff.tag.base';
import { CogTiffTag } from './read/tiff.tag';
import { Size } from './vector';
import { CogTiffTagOffset } from './read/tag/tiff.tag.offset';

/**
 * Number of tiles used inside this image
 */
export interface CogTiffImageTiledCount {
    /** Number of tiles on the x axis */
    x: number;
    /** Number of tiles on the y axis */
    y: number;
}

/**
 * Size of a individual tile
 */
export interface CogTiffImageTileSize {
    /** Tile width (pixels) */
    width: number;
    /** Tile height (pixels) */
    height: number;
}

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

    /** Force loading of important tags if they have not already been loaded */
    async init() {
        const requiredTags = [
            TiffTag.Compression,
            TiffTag.ImageHeight,
            TiffTag.ImageWidth,
            TiffTag.ModelPixelScale,
            TiffTag.ModelTiePoint,
            TiffTag.ModelTransformation,
            TiffTag.TileHeight,
            TiffTag.TileWidth,
        ];

        return Promise.all(requiredTags.map(c => this.fetch(c)));
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
        if (tiePoints != null && tiePoints.length === 6) {
            return [tiePoints[3], tiePoints[4], tiePoints[5]];
        }

        const modelTransformation = this.value(TiffTag.ModelTransformation);
        if (modelTransformation != null) {
            return [modelTransformation[3], modelTransformation[7], modelTransformation[11]];
        }

        // If this is a sub image, use the origin from the top level image
        if (this.value(TiffTag.NewSubFileType) === 1 && this.id !== 0) {
            return this.tif.images[0].origin;
        }

        throw new Error('Image does not have a geo transformation.');
    }

    /**
     * Get the resolution of the image
     *
     * @returns [x,y,z] pixel scale
     */
    get resolution(): [number, number, number] {
        const modelPixelScale: number[] | null = this.value(TiffTag.ModelPixelScale);
        if (modelPixelScale != null) {
            return [modelPixelScale[0], -modelPixelScale[1], modelPixelScale[2]];
        }
        const modelTransformation: number[] | null = this.value(TiffTag.ModelTransformation);
        if (modelTransformation != null) {
            return [modelTransformation[0], modelTransformation[5], modelTransformation[10]];
        }

        // If this is a sub image, use the resolution from the top level image
        if (this.value(TiffTag.NewSubFileType) === 1 && this.id !== 0) {
            const firstImg = this.tif.images[0];
            const [resX, resY, resZ] = firstImg.resolution;
            const firstImgSize = firstImg.size;
            const imgSize = this.size;
            // scale resolution based on the size difference between the two images
            return [(resX * firstImgSize.width) / imgSize.width, (resY * firstImgSize.height) / imgSize.height, resZ];
        }
        throw new Error('Image does not have a geo transformation.');
    }

    /**
     * Bounding box of the image
     *
     * @returns [minX, minY, maxX, maxY] bounding box
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
    get compression(): TiffMimeType | null {
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
    public isTiled(): boolean {
        return this.value(TiffTag.TileWidth) !== null;
    }

    /**
     * Get size of individual tiles
     */
    get tileSize(): CogTiffImageTileSize {
        return {
            width: this.value(TiffTag.TileWidth),
            height: this.value(TiffTag.TileHeight),
        };
    }

    /**
     * Number of tiles used to create this image
     */
    get tileCount(): CogTiffImageTiledCount {
        const size = this.size;
        const tileSize = this.tileSize;
        const x = Math.ceil(size.width / tileSize.width);
        const y = Math.ceil(size.height / tileSize.height);
        return { x, y };
    }

    /**
     * Get the pointer to where the tiles start in the Tiff file
     *
     * @remarks Used to read tiled tiffs
     *
     * @returns file offset to where the tiffs are stored
     */
    get tileOffset(): CogTiffTagOffset {
        const tileOffset = this.tags.get(TiffTag.TileOffsets) as CogTiffTagOffset;
        if (tileOffset == null) {
            throw new Error('No Tile Offsets found');
        }
        return tileOffset;
    }

    /**
     * Get a pointer to a specific tile inside the tiff file
     *
     * @param index tile index
     * @returns file offset of the specified tile
     */
    protected async getTileOffset(index: number): Promise<number> {
        const tileOffset = this.tileOffset;
        if (index < 0 || index > tileOffset.dataCount) {
            throw new Error(`Tile offset: ${index} out of range: 0 -> ${tileOffset.dataCount}`);
        }

        // Fetch only the part of the offsets that are needed
        return tileOffset.getValueAt(index);
    }

    /**
     * Load the tile buffer, this works best with webp
     *
     * This will also apply the JPEG compression tables
     *
     * TODO apply JPEG masks
     * @param x Tile x offset
     * @param y Tile y offset
     */
    async getTile(x: number, y: number) {
        const mimeType = this.compression;
        const size = this.size;
        const tiles = this.tileSize;

        if (tiles == null) {
            throw new Error('Tiff is not tiled');
        }

        if (mimeType == null) {
            throw new Error('Unsupported compression: ' + this.value(TiffTag.Compression));
        }

        // TODO support GhostOptionTileOrder
        const nyTiles = Math.ceil(size.height / tiles.height);
        const nxTiles = Math.ceil(size.width / tiles.width);

        if (x >= nxTiles || y >= nyTiles) {
            return null;
        }

        const idx = y * nxTiles + x;
        const totalTiles = nxTiles * nyTiles;
        if (idx >= totalTiles) {
            return null; // TODO should this throw a error?
        }

        const bytes = await this.getTileBytes(idx);

        if (this.compression == TiffMimeType.JPEG) {
            const tables: number[] = this.value(TiffTag.JPEGTables);
            // Both the JPEGTable and the Bytes with have the start of image and end of image markers
            // SOI 0xffd8 EOI 0xffd9
            // Remove EndOfImage marker
            const tableData = tables.slice(0, tables.length - 2);
            const actualBytes = new Uint8Array(bytes.byteLength + tableData.length - 2);
            actualBytes.set(tableData, 0);
            actualBytes.set(bytes.slice(2), tableData.length);

            return { mimeType, bytes: actualBytes };
        }
        return { mimeType, bytes: new Uint8Array(bytes) };
    }

    protected async getTileSize(index: number): Promise<{ offset: number; imageSize: number }> {
        // GDAL optimizes tiles by storing the size of the tile in
        // the few bytes leading up to the tile
        if (this.tif.options.tileLeaderByteSize) {
            const offset = await this.getTileOffset(index);
            const leaderBytes = this.tif.options.tileLeaderByteSize;
            // This fetch will generally load in the bytes needed for the image too
            // provided the image size is less than the size of a chunk
            await this.tif.source.loadBytes(offset - leaderBytes, this.tif.source.chunkSize);
            return { offset, imageSize: this.tif.source.uint(offset - leaderBytes, leaderBytes) };
        }

        const byteCounts = this.tags.get(TiffTag.TileByteCounts) as CogTiffTagOffset;
        if (byteCounts == null) {
            throw new Error('No tile byte counts found');
        }
        const [offset, imageSize] = await Promise.all([this.getTileOffset(index), byteCounts.getValueAt(index)]);
        return { offset, imageSize };
    }

    /** Load the raw bytes of the tile at the provided index */
    protected async getTileBytes(index: number): Promise<Uint8Array> {
        const { offset, imageSize } = await this.getTileSize(index);
        await this.tif.source.loadBytes(offset, imageSize);
        return this.tif.source.bytes(offset, imageSize);
    }
}
