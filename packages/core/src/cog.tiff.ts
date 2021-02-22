import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { CogTiffImage } from './cog.tiff.image';
import { TiffEndian } from './const/tiff.endian';
import { TiffTag } from './const/tiff.tag.id';
import { TiffVersion } from './const/tiff.version';
import { CogTiffTagBase } from './read/tag/tiff.tag.base';
import { CogTifGhostOptions } from './read/tiff.gdal';
import { TagTiffBigConfig, TagTiffConfig, TiffIfdConfig } from './read/tiff.ifd.config';
import { CogTiffTag } from './read/tiff.tag';
import { CogSourceCursor } from './source/cog.source.view';
import { toHexString } from './util/util.hex';

export class CogTiff {
    source: ChunkSource;
    version = TiffVersion.Tiff;
    images: CogTiffImage[] = [];
    options = new CogTifGhostOptions();

    private cursor: CogSourceCursor;
    ifdConfig: TiffIfdConfig = TagTiffConfig;

    constructor(source: ChunkSource) {
        this.source = source;
        this.cursor = new CogSourceCursor(this);
    }

    /** Create and initialize a CogTiff */
    static create(source: ChunkSource): Promise<CogTiff> {
        return new CogTiff(source).init();
    }

    /** Has init() been called */
    isInitialized = false;

    _initPromise?: Promise<CogTiff>;
    /**
     * Initialize the COG loading in the header and all image headers
     *
     * @param loadGeoKeys Whether to also initialize the GeoKeyDirectory
     */
    init(loadGeoKeys = false, logger?: LogType): Promise<CogTiff> {
        if (this._initPromise) return this._initPromise;
        this._initPromise = this.doInit(loadGeoKeys, logger);
        return this._initPromise;
    }

    private async doInit(loadGeoKeys = false, logger?: LogType): Promise<CogTiff> {
        if (this.isInitialized) return this;
        // Load the first few KB in, more loads will run as more data is required
        await this.source.loadBytes(0, this.source.chunkSize, logger);
        await this.fetchIfd(logger);
        await Promise.all(this.images.map((c) => c.init(loadGeoKeys, logger)));

        this.isInitialized = true;
        return this;
    }

    private async fetchIfd(logger?: LogType): Promise<void> {
        const view = this.cursor.seekTo(0);
        const endian = view.uint16();
        this.source.isLittleEndian = endian === TiffEndian.Little;
        if (!this.source.isLittleEndian) throw new Error('Only little endian is supported');
        this.version = view.uint16();

        let nextOffsetIfd: number;
        if (this.version === TiffVersion.BigTiff) {
            this.ifdConfig = TagTiffBigConfig;
            const pointerSize = view.uint16();
            if (pointerSize !== 8) throw new Error('Only 8byte pointers are supported');
            const zeros = view.uint16();
            if (zeros !== 0) throw new Error('Invalid big tiff header');
            nextOffsetIfd = view.pointer();
        } else if (this.version === TiffVersion.Tiff) {
            nextOffsetIfd = view.pointer();
        } else {
            throw new Error(`Only tiff supported version:${this.version}`);
        }

        const ghostSize = nextOffsetIfd - this.cursor.currentOffset;
        // GDAL now stores metadata between the IFD inside a ghost storage area
        if (ghostSize > 0 && ghostSize < 16 * 1024) {
            logger?.debug(
                { offset: toHexString(this.cursor.currentOffset), length: toHexString(ghostSize) },
                'GhostOptions',
            );
            // this.options.process(this.source, view.currentOffset, ghostSize);
        }

        return this.processIfd(nextOffsetIfd, logger);
    }

    getImage(z: number): CogTiffImage {
        return this.images[z];
    }

    /**
     * Find a image which has a resolution similar to the provided resolution
     *
     * @param resolution resolution to find
     */
    getImageByResolution(resolution: number): CogTiffImage {
        const firstImage = this.images[0];
        const firstImageSize = firstImage.size;
        const [refX] = firstImage.resolution;

        const resolutionBaseX = refX * firstImageSize.width;
        // const resolutionBaseY = refY * firstImageSize.height;
        for (let i = this.images.length - 1; i > 0; i--) {
            const img = this.images[i];
            const imgSize = img.size;

            const imgResolutionX = resolutionBaseX / imgSize.width;
            // TODO do we care about y resolution
            // const imgResolutionY = resolutionBaseY / imgSize.height;

            if (imgResolutionX - resolution <= 0.01) return img;
        }
        return firstImage;
    }

    /**
     * Get the raw bytes for a tile at a given x,y, index.
     *
     * This may return null if the tile does not exist eg Sparse cogs,
     *
     * @param x tile x index
     * @param y tile y index
     * @param index image index
     */
    async getTile(x: number, y: number, index: number): Promise<{ mimeType: string; bytes: Uint8Array } | null> {
        const image = this.getImage(index);
        if (image == null) throw new Error(`Missing z: ${index}`);
        if (!image.isTiled()) throw new Error('Tif is not tiled');

        return image.getTile(x, y);
    }

    private async processIfd(offset: number, logger?: LogType): Promise<void> {
        logger?.trace({ offset: toHexString(offset) }, 'NextImageOffset');

        if (!this.source.hasBytes(offset, 4096)) {
            await this.source.loadBytes(offset, 4096, logger);
        }

        const { image, nextOffset } = await this.readIfd(offset, logger);
        this.images.push(image);
        const size = image.size;
        if (image.isTiled()) {
            const tile = image.tileSize;
            logger?.debug(
                {
                    ...size,
                    tileWidth: tile.width,
                    tileHeight: tile.height,
                    tileCount: Math.ceil(size.width / tile.width),
                },
                'GotImage',
            );
        }

        if (nextOffset) await this.processIfd(nextOffset, logger);
    }

    private async readIfd(offset: number, log?: LogType): Promise<{ nextOffset: number; image: CogTiffImage }> {
        const view = this.cursor.seekTo(offset);
        const tagCount = view.offset();
        const byteStart = offset + this.ifdConfig.offset;
        const logger = log?.child({ imageId: this.images.length });
        const tags: Map<TiffTag, CogTiffTagBase> = new Map();

        let pos = byteStart;
        for (let i = 0; i < tagCount; i++) {
            const tag = CogTiffTag.create(this, pos);
            pos += tag.size;

            if (tag.name == null) {
                logger?.error({ code: toHexString(tag.id) }, `IFDUnknown`);
                continue;
            }

            if (!tag.isReady) {
                logger?.trace(
                    {
                        offset: toHexString(pos - offset),
                        code: toHexString(tag.id),
                        tagName: tag.name,
                        ptr: toHexString(tag.valuePointer),
                    },
                    'PartialReadIFD',
                );
            } else {
                logger?.trace(
                    {
                        offset: toHexString(pos - offset),
                        code: toHexString(tag.id),
                        tagName: tag.name,
                        value: Array.isArray(tag.value) ? `[${tag.value.length}]` : tag.value,
                    },
                    'ReadIFD',
                );
            }

            tags.set(tag.id, tag);
        }

        const image = new CogTiffImage(this, this.images.length, tags);
        const nextOffset = this.source.uint(pos, this.ifdConfig.pointer);
        return { nextOffset, image };
    }

    /** Close the file source if it needs closing */
    async close(): Promise<void> {
        await this.source?.close?.();
    }
}
