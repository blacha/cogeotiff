import { CogTiffImage } from './cog.tiff.image';
import { TiffMimeType } from './const/tiff.mime';
import { TiffTag } from './const/tiff.tag.id';
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

/**
 * A COG image that is tiled internally
 */
export class CogTiffImageTiled extends CogTiffImage {
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
