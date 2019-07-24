import { CogTifImage } from './cog.tif.image';
import { Size } from './@types/vector';
import { TiffTag } from './read/tif';
import { CogTifTagOffset } from './read/cog.tif.tag';
import { MimeType } from './read/mime';

export class CogTifImageTiled extends CogTifImage {
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

    get tileOffset(): CogTifTagOffset {
        const tileOffset = this.tags.get(TiffTag.TileOffsets) as CogTifTagOffset;
        if (tileOffset == null) {
            throw new Error('No Tile Offsets found');
        }
        return tileOffset;
    }

    async getTileOffset(index: number): Promise<number> {
        const tileOffset = this.tileOffset;
        if (index < 0 || index > tileOffset.dataCount) {
            throw new Error(`Tile offset: ${index} out of range: 0 -> ${tileOffset.dataCount}`);
        }

        // Fetch only the part of the offsets that are needed
        return tileOffset.getValueAt(index);
    }

    /**
     * Load the tile buffer, works best with webp
     *
     * This will apply the JPEG compression tables
     *
     * TODO apply JPEG masks
     */
    async getTile(x: number, y: number) {
        const mimeType = this.compression;
        const size = this.size;
        const tiles = this.tileInfo;

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
        if (idx >= this.tileCount.total) {
            return null; // TODO should this throw a error?
        }

        const bytes = await this.getTileBytes(idx);

        if (this.compression == MimeType.JPEG) {
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

    async getTileSize(index: number): Promise<{ offset: number; imageSize: number }> {
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

        const byteCounts = this.tags.get(TiffTag.TileByteCounts) as CogTifTagOffset;
        if (byteCounts == null) {
            throw new Error('No tile byte counts found');
        }
        const [offset, imageSize] = await Promise.all([this.getTileOffset(index), byteCounts.getValueAt(index)]);
        return { offset, imageSize };
    }

    /** Load the raw bytes of the tile at the provided index */
    async getTileBytes(index: number): Promise<Uint8Array> {
        const { offset, imageSize } = await this.getTileSize(index);
        await this.tif.source.loadBytes(offset, imageSize);
        return this.tif.source.bytes(offset, imageSize);
    }
}
