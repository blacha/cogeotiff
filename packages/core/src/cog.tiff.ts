import { CogTiffImage } from './cog.tiff.image';
import { TiffEndian } from './const/tiff.endian';
import { TiffTag } from './const/tiff.tag.id';
import { TiffVersion } from './const/tiff.version';
import { CogTiffTagBase } from './read/tag/tiff.tag.base';
import { CogTifGhostOptions } from './read/tiff.gdal';
import { CogTiffTag } from './read/tiff.tag';
import { CogSource } from './source/cog.source';
import { toHexString } from './util/util.hex';
import { getLogger } from './util/util.log';

const HEADER_BUFFER_SIZE = 2048;

export class CogTiff {
    source: CogSource;
    version = -1;
    images: CogTiffImage[] = [];
    options = new CogTifGhostOptions();

    constructor(source: CogSource) {
        this.source = source;
    }

    /** Has init() been called */
    isInitialized = false;

    /**
     * Initialize the COG loading in the header and all image headers
     *
     * @param loadGeoKeys Whether to also initialize the GeoKeyDirectory
     */
    async init(loadGeoKeys = false): Promise<CogTiff> {
        if (this.isInitialized) return this;
        // Load the first few KB in, more loads will run as more data is required
        await this.source.loadBytes(0, 4 * HEADER_BUFFER_SIZE);
        await this.fetchIfd();
        await Promise.all(this.images.map((c) => c.init(loadGeoKeys)));

        this.isInitialized = true;
        return this;
    }

    private async fetchIfd() {
        const view = this.source.getView(0);
        const endian = view.uint16();
        this.source.isLittleEndian = endian === TiffEndian.LITTLE;
        if (!this.source.isLittleEndian) {
            throw new Error('Only little endian is supported');
        }
        this.version = view.uint16();

        let nextOffsetIfd: number;
        if (this.version == TiffVersion.BigTiff) {
            const pointerSize = view.uint16();
            if (pointerSize !== 8) {
                throw new Error('Only 8byte pointers are supported');
            }
            const zeros = view.uint16();
            if (zeros !== 0) {
                throw new Error('Invalid big tiff header');
            }
            this.source.setVersion(TiffVersion.BigTiff);
            nextOffsetIfd = view.pointer();
        } else if (this.version === TiffVersion.Tiff) {
            this.source.setVersion(TiffVersion.Tiff);
            nextOffsetIfd = view.pointer();
        } else {
            throw new Error(`Only tiff supported version:${this.version}`);
        }

        const ghostSize = nextOffsetIfd - view.currentOffset;
        // GDAL now stores metadata between the IFD inside a ghost storage area
        if (ghostSize > 0 && ghostSize < 16 * 1024) {
            getLogger()?.debug(
                { offset: toHexString(view.currentOffset), length: toHexString(ghostSize) },
                'GhostOptions',
            );
            this.options.process(this.source, view.currentOffset, ghostSize);
        }

        return this.processIfd(nextOffsetIfd);
    }

    getImage(z: number) {
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

            if (imgResolutionX - resolution <= 0.01) {
                return img;
            }
        }
        return firstImage;
    }

    async getTileRaw(x: number, y: number, index: number): Promise<{ mimeType: string; bytes: ArrayBuffer } | null> {
        const image = this.getImage(index);
        if (image == null) {
            throw new Error(`Missing z: ${index}`);
        }

        if (!image.isTiled()) {
            throw new Error('Tif is not tiled');
        }
        return image.getTile(x, y);
    }

    private async processIfd(offset: number) {
        const logger = getLogger();
        logger?.trace({ offset: toHexString(offset) }, 'NextImageOffset');

        if (!this.source.hasBytes(offset, HEADER_BUFFER_SIZE)) {
            await this.source.loadBytes(offset, HEADER_BUFFER_SIZE);
        }
        const { image, nextOffset } = await this.readIfd(offset);
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

        if (nextOffset) {
            await this.processIfd(nextOffset);
        }
    }

    private async readIfd(offset: number) {
        const view = this.source.getView(offset);
        const tagCount = view.offset();
        const byteStart = offset + this.source.config.offset;
        const logger = getLogger({ imageId: this.images.length });
        const tags: Map<TiffTag, CogTiffTagBase> = new Map();

        let pos = byteStart;
        for (let i = 0; i < tagCount; i++) {
            const tag = CogTiffTag.create(this.source, pos);
            pos += tag.size;

            if (tag.name == null) {
                if (logger != null) {
                    logger.error({ code: toHexString(tag.id) }, `IFDUnknown`);
                }
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
        const nextOffset = await this.source.pointer(pos);
        return { nextOffset, image };
    }
}
