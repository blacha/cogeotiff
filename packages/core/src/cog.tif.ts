import { CogSource } from './source/cog.source';
import { CogTifImage } from './cog.tif.image';
import { CogTifTag, CogTifTagFactory } from './read/cog.tif.tag';
import { TiffEndian, TiffTag, TiffVersion } from './read/tif';
import { CogTifGhostOptions } from './read/tif.gdal';
import { toHexString } from './util/util.hex';
import { getLogger } from './util/util.log';
import { CogTifImageTiled } from './cog.tif.image.tiled';

export class CogTif {
    source: CogSource;
    version: number = -1;
    images: CogTifImage[] = [];
    options = new CogTifGhostOptions();

    constructor(source: CogSource) {
        this.source = source;
    }

    async init(): Promise<CogTif> {
        // Load the first few KB in, more loads will run as more data is required
        await this.source.loadBytes(0, 4 * 1024);
        await this.fetchIfd();
        return this;
    }

    async fetchIfd() {
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
            this.options.process(this.source, view.currentOffset, ghostSize);
        }

        return this.processIfd(nextOffsetIfd);
    }

    getImage(z: number) {
        return this.images[z];
    }

    async getTileRaw(x: number, y: number, z: number): Promise<{ mimeType: string; bytes: ArrayBuffer } | null> {
        const image = this.getImage(z);
        if (image == null) {
            throw new Error(`Missing z: ${z}`);
        }

        if (!image.isTiled()) {
            throw new Error('Tif is not tiled');
        }
        return image.getTile(x, y);
    }

    async processIfd(offset: number) {
        const { image, nextOffset } = await this.readIfd(offset);
        this.images.push(image);
        const size = image.size;
        if (!image.isTiled()) {
            getLogger().warn('Tiff is not tiled');
        } else {
            const tile = image.tileInfo;
            getLogger().debug(
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
            getLogger().trace({ offset: toHexString(nextOffset) }, 'NextImageOffset');
            await this.source.loadBytes(nextOffset, 1024);
            await this.processIfd(nextOffset);
        }
    }

    private async readIfd(offset: number) {
        const view = this.source.getView(offset);
        const tagCount = view.offset();
        const byteStart = offset + this.source.config.offset;
        const logger = getLogger().child({ imageId: this.images.length });
        const tags: Map<TiffTag, CogTifTag<any>> = new Map();

        let pos = byteStart;
        for (let i = 0; i < tagCount; i++) {
            const tag = CogTifTagFactory.create(this.source, pos);
            pos += tag.size;

            if (tag.name == null) {
                logger.error({ code: toHexString(tag.id) }, `IFDUnknown`);
                continue;
            }

            const logObj = {
                offset: toHexString(pos - offset),
                code: toHexString(tag.id),
                tagName: tag.name,
            };
            if (tag.value == null) {
                logger.trace({ ...logObj, ptr: toHexString(tag.valuePointer) }, 'PartialReadIFD');
            } else {
                const displayValue = Array.isArray(tag.value) ? `[${tag.value.length}]` : tag.value;
                logger.trace({ ...logObj, value: displayValue }, 'ReadIFD');
            }
            tags.set(tag.id, tag);
        }

        let image: CogTifImage;
        const tileWidth = tags.get(TiffTag.TileWidth);
        if (tileWidth != null && tileWidth.value > 0) {
            image = new CogTifImageTiled(this, this.images.length, offset, tags);
        } else {
            image = new CogTifImage(this, this.images.length, byteStart, tags);
        }
        const nextOffset = await this.source.pointer(pos);
        return { nextOffset, image };
    }
}
