import { LogType } from '@cogeotiff/chunk';
import { CogTiff } from './cog.tiff';
import { TiffCompression, TiffMimeType } from './const/tiff.mime';
import { TiffTag, TiffTagGeo } from './const/tiff.tag.id';
import { CogTiffTagBase } from './read/tag/tiff.tag.base';
import { CogTiffTagLazy } from './read/tag/tiff.tag.lazy';
import { CogTiffTagOffset } from './read/tag/tiff.tag.offset';
import { CogTiffTag } from './read/tiff.tag';
import { BoundingBox, Size } from './vector';

/** Invalid EPSG code */
export const InvalidProjectionCode = 32767;

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

    /** Has loadGeoTiffTags been called */
    private tagsGeoLoaded = false;
    /** Sub tags stored in TiffTag.GeoKeyDirectory */
    tagsGeo: Map<TiffTagGeo, string | number> = new Map();

    constructor(tif: CogTiff, id: number, tags: Map<TiffTag, CogTiffTagBase>) {
        this.tif = tif;
        this.id = id;
        this.tags = tags;
    }

    /**
     * Force loading of important tags if they have not already been loaded
     *
     * @param loadGeoTags Whether to load the GeoKeyDirectory and unpack it
     */
    async init(loadGeoTags = false, l: LogType = null as any): Promise<void> {
        const requiredTags = [
            this.fetch(TiffTag.Compression, l),
            this.fetch(TiffTag.ImageHeight, l),
            this.fetch(TiffTag.ImageWidth, l),
            this.fetch(TiffTag.ModelPixelScale, l),
            this.fetch(TiffTag.ModelTiePoint, l),
            this.fetch(TiffTag.ModelTransformation, l),
            this.fetch(TiffTag.TileHeight, l),
            this.fetch(TiffTag.TileWidth, l),
        ];

        if (loadGeoTags) {
            requiredTags.push(this.fetch(TiffTag.GeoKeyDirectory, l));
            requiredTags.push(this.fetch(TiffTag.GeoAsciiParams, l));
            requiredTags.push(this.fetch(TiffTag.GeoDoubleParams, l));
        }

        await Promise.all(requiredTags);
        if (loadGeoTags) {
            await this.loadGeoTiffTags(l);
        }
    }

    /**
     * Get the value of a TiffTag if it exists null otherwise
     */
    value<T>(tag: TiffTag): T | null {
        const sourceTag = this.tags.get(tag);
        if (sourceTag == null) return null;
        return sourceTag.value as T;
    }

    /**
     * Load and unpack the GeoKeyDirectory
     */
    async loadGeoTiffTags(l: LogType): Promise<void> {
        // Already loaded
        if (this.tagsGeoLoaded) return;
        const sourceTag = this.tags.get(TiffTag.GeoKeyDirectory);
        if (sourceTag == null) {
            this.tagsGeoLoaded = true;
            return;
        }
        if (!sourceTag.isReady && sourceTag instanceof CogTiffTagLazy) {
            // Load all the required keys
            await Promise.all([
                this.fetch(TiffTag.GeoKeyDirectory, l),
                this.fetch(TiffTag.GeoAsciiParams, l),
                this.fetch(TiffTag.GeoDoubleParams, l),
            ]);
        }
        this.tagsGeoLoaded = true;
        if (sourceTag.value == null) return;
        const geoTags = sourceTag.value;
        if (!Array.isArray(geoTags)) throw new Error('Invalid geo tags found');
        for (let i = 4; i <= geoTags[3] * 4; i += 4) {
            const key = geoTags[i] as TiffTagGeo;
            const location = geoTags[i + 1];

            const offset = geoTags[i + 3];

            if (location === 0) {
                this.tagsGeo.set(key, offset);
                continue;
            }
            const tag = this.tags.get(location);
            if (tag == null || tag.value == null) continue;
            const count = geoTags[i + 2];
            if (Array.isArray(tag.value)) {
                this.tagsGeo.set(key, tag.value[offset + count - 1]);
            } else if (typeof tag.value === 'string') {
                this.tagsGeo.set(key, tag.value.substr(offset, offset + count - 1).trim());
            }
        }
    }

    /**
     * Get the associated GeoTiffTags
     */
    valueGeo(tag: TiffTagGeo): string | number | undefined {
        if (this.tagsGeoLoaded === false) throw new Error('loadGeoTiffTags() has not been called');
        return this.tagsGeo.get(tag);
    }

    /**
     * Load a tag, if it is not currently loaded, fetch the required data for the tag.
     * @param tag tag to fetch
     */
    public async fetch<T>(tag: TiffTag, l: LogType): Promise<T | null> {
        const sourceTag = this.tags.get(tag);
        if (sourceTag == null) return null;
        if (CogTiffTag.isLazy(sourceTag)) return sourceTag.fetch(l) as any;
        return sourceTag.value as T;
    }

    /**
     * Get the origin point for the image
     *
     * @returns origin point of the image
     */
    get origin(): [number, number, number] {
        const tiePoints: number[] | null = this.value<number[]>(TiffTag.ModelTiePoint);
        if (tiePoints != null && tiePoints.length === 6) {
            return [tiePoints[3], tiePoints[4], tiePoints[5]];
        }

        const modelTransformation = this.value<number[]>(TiffTag.ModelTransformation);
        if (modelTransformation != null) {
            return [modelTransformation[3], modelTransformation[7], modelTransformation[11]];
        }

        // If this is a sub image, use the origin from the top level image
        if (this.value(TiffTag.NewSubFileType) === 1 && this.id !== 0) {
            return this.tif.images[0].origin;
        }

        throw new Error('Image does not have a geo transformation.');
    }

    /** Is there enough geo information on this image to figure out where its actually located */
    get isGeoLocated(): boolean {
        const isImageLocated =
            this.value(TiffTag.ModelPixelScale) != null || this.value(TiffTag.ModelTransformation) != null;
        if (isImageLocated) return true;
        // If this is a sub image, use the isGeoLocated from the top level image
        if (this.value(TiffTag.NewSubFileType) === 1 && this.id !== 0) return this.tif.images[0].isGeoLocated;
        return false;
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
    get bbox(): [number, number, number, number] {
        const size = this.size;
        const origin = this.origin;
        const resolution = this.resolution;

        if (origin == null || size == null || resolution == null) {
            throw new Error('Unable to calculate bounding box');
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
     * Attempt to read the EPSG Code from TiffGeoTags
     *
     * @returns EPSG Code if it exists
     */
    get epsg(): number | null {
        const projection = this.valueGeo(TiffTagGeo.ProjectedCSTypeGeoKey) as number;
        if (projection === InvalidProjectionCode) return null;
        return projection;
    }

    /**
     * Get the size of the image
     *
     * @returns Size in pixels
     */
    get size(): Size {
        return {
            width: this.value<number>(TiffTag.ImageWidth)!,
            height: this.value<number>(TiffTag.ImageHeight)!,
        };
    }

    /**
     * Get the list of IFD tags that were read
     */
    get tagList(): string[] {
        return [...this.tags.keys()].map((c) => TiffTag[c]);
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
            width: this.value<number>(TiffTag.TileWidth)!,
            height: this.value<number>(TiffTag.TileHeight)!,
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
        if (tileOffset == null) throw new Error('No tile offsets found');
        return tileOffset;
    }

    /**
     * Get the number of strip's inside this tiff
     *
     * @remarks Used to read striped tiffs
     *
     * @returns number of strips present
     */
    get stripCount(): number {
        const tileOffset = this.tags.get(TiffTag.StripByteCounts) as CogTiffTagOffset;
        if (tileOffset == null) return 0;
        return tileOffset.dataCount;
    }

    /**
     * Get a pointer to a specific tile inside the tiff file
     *
     * @param index tile index
     * @returns file offset of the specified tile
     */
    protected async getTileOffset(index: number, l?: LogType): Promise<number> {
        const tileOffset = this.tileOffset;
        if (index < 0 || index > tileOffset.dataCount) {
            throw new Error(`Tile offset: ${index} out of range: 0 -> ${tileOffset.dataCount}`);
        }

        // Fetch only the part of the offsets that are needed
        return tileOffset.getValueAt(index, l);
    }

    // Clamp the bounds of the output image to the size of the image, as sometimes the edge tiles are not full tiles
    getTileBounds(x: number, y: number): BoundingBox {
        const { size, tileSize } = this;
        const top = y * tileSize.height;
        const left = x * tileSize.width;
        const width = left + tileSize.width >= size.width ? size.width - left : tileSize.width;
        const height = top + tileSize.height >= size.height ? size.height - top : tileSize.height;
        return { x: left, y: top, width, height };
    }

    /**
     * Read a strip into a uint8 array
     *
     * @param index Strip index to read
     */
    async getStrip(index: number): Promise<{ mimeType: TiffMimeType; bytes: Uint8Array } | null> {
        if (this.isTiled()) throw new Error('Cannot read stripes, tiff is tiled');

        const byteCounts = this.tags.get(TiffTag.StripByteCounts) as CogTiffTagOffset;
        const offsets = this.tags.get(TiffTag.StripOffsets) as CogTiffTagOffset;

        if (index >= byteCounts.dataCount) throw new Error('Cannot read strip, index out of bounds');

        const [byteCount, offset] = await Promise.all([offsets.getValueAt(index), byteCounts.getValueAt(index)]);
        return this.getBytes(byteCount, offset);
    }

    /** The jpeg header is stored in the IFD, read the JPEG header and adjust the byte array to include it */
    private getJpegHeader(bytes: Uint8Array): Uint8Array {
        // Both the JPEGTable and the Bytes with have the start of image and end of image markers
        // StartOfImage 0xffd8 EndOfImage 0xffd9
        const tables = this.value<number[]>(TiffTag.JPEGTables);
        if (tables == null) throw new Error('Unable to find Jpeg header');

        // Remove EndOfImage marker
        const tableData = tables.slice(0, tables.length - 2);
        const actualBytes = new Uint8Array(bytes.byteLength + tableData.length - 2);
        actualBytes.set(tableData, 0);
        actualBytes.set(bytes.slice(2), tableData.length);
        return actualBytes;
    }

    /** Read image bytes at the given offset */
    private async getBytes(
        offset: number,
        byteCount: number,
        l?: LogType,
    ): Promise<{ mimeType: TiffMimeType; bytes: Uint8Array } | null> {
        const mimeType = this.compression;
        if (mimeType == null) throw new Error('Unsupported compression: ' + this.value(TiffTag.Compression));
        if (byteCount === 0) return null;

        await this.tif.source.loadBytes(offset, byteCount, l);
        const bytes = this.tif.source.bytes(offset, byteCount);

        if (this.compression === TiffMimeType.JPEG) {
            return { mimeType, bytes: this.getJpegHeader(bytes) };
        }
        return { mimeType, bytes };
    }

    /**
     * Load the tile buffer, this works best with webp
     *
     * This will also apply the JPEG compression tables
     *
     * @param x Tile x offset
     * @param y Tile y offset
     */
    async getTile(x: number, y: number, l?: LogType): Promise<{ mimeType: TiffMimeType; bytes: Uint8Array } | null> {
        const mimeType = this.compression;
        const size = this.size;
        const tiles = this.tileSize;

        if (tiles == null) throw new Error('Tiff is not tiled');
        if (mimeType == null) throw new Error('Unsupported compression: ' + this.value(TiffTag.Compression));

        // TODO support GhostOptionTileOrder
        const nyTiles = Math.ceil(size.height / tiles.height);
        const nxTiles = Math.ceil(size.width / tiles.width);

        if (x >= nxTiles || y >= nyTiles) {
            throw new Error(`Tile index is outside of range x:${x} >= ${nxTiles} or y:${y} >= ${nyTiles}`);
        }

        const idx = y * nxTiles + x;
        const totalTiles = nxTiles * nyTiles;
        if (idx >= totalTiles) throw new Error(`Tile index is outside of tile range: ${idx} >= ${totalTiles}`);

        const { offset, imageSize } = await this.getTileSize(idx, l);
        return this.getBytes(offset, imageSize, l);
    }

    protected async getTileSize(index: number, l?: LogType): Promise<{ offset: number; imageSize: number }> {
        // GDAL optimizes tiles by storing the size of the tile in
        // the few bytes leading up to the tile
        if (this.tif.options.tileLeaderByteSize) {
            const offset = await this.getTileOffset(index, l);
            // Sparse COG no data found
            if (offset === 0) return { offset: 0, imageSize: 0 };

            const leaderBytes = this.tif.options.tileLeaderByteSize;
            // This fetch will generally load in the bytes needed for the image too
            // provided the image size is less than the size of a chunk
            await this.tif.source.loadBytes(offset - leaderBytes, leaderBytes, l);
            return { offset, imageSize: this.tif.source.uint(offset - leaderBytes, leaderBytes) };
        }

        const byteCounts = this.tags.get(TiffTag.TileByteCounts) as CogTiffTagOffset;
        if (byteCounts == null) {
            throw new Error('No tile byte counts found');
        }
        const [offset, imageSize] = await Promise.all([this.getTileOffset(index, l), byteCounts.getValueAt(index, l)]);
        return { offset, imageSize };
    }
}
