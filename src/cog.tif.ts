import { CogSource } from './cog.source';
import { CogTifImage } from './cog.tif.image';
import { TiffEndian, TiffTag, TiffVersion, TiffCompression } from './read/tif';
import { CogTifGhostOptions } from './read/tif.gdal';
import { toHexString } from './util/util.hex';
import { Logger } from './util/util.log';
import { CogTifTag } from './read/cog.tif.tag';
import { MimeType } from './read/tif'

export class CogTif {
    source: CogSource;
    version: number = -1;
    images: CogTifImage[] = [];
    options = new CogTifGhostOptions();

    constructor(source: CogSource) {
        this.source = source;
    }

    async init(): Promise<CogTif> {
        await this.source.loadBytes(0, 1024);
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
        const mimeType = image.compression;
        const size = image.size;
        const tiles = image.tileInfo;
        if (tiles == null) {
            throw new Error('Tiff is not tiled');
        }
        if (mimeType == null) {
            throw new Error('Unsupported compression: ' + image.value(TiffTag.Compression));
        }

        const nyTiles = Math.ceil(size.width / tiles.width);
        const idx = y * nyTiles + x;

        // TODO load only the parts of the tiles we care about
        const [tileOffsets, byteCounts] = await Promise.all([
            image.fetch(TiffTag.TileOffsets),
            image.fetch(TiffTag.TileByteCounts),
        ]);

        if (idx > tileOffsets.length) {
            return null;
        }

        let offset: number;
        let byteCount: number;
        // if there is only one tile the offsets are not a array
        // they are a direct reference to the tile
        if (idx === 0 && typeof tileOffsets === 'number') {
            offset = tileOffsets;
            byteCount = byteCounts;
        } else {
            offset = tileOffsets[idx];
            byteCount = byteCounts[idx];
        }

        if (typeof offset !== 'number' || typeof byteCount !== 'number') {
            throw new Error(`Invalid tile offset:${offset} count: ${byteCount}`);
        }
        await this.source.loadBytes(offset, byteCount);
        const bytes = this.source.bytes(offset, byteCount);
        if (image.compression == MimeType.JPEG) {
            const tables: number[] = image.value(TiffTag.JPEGTables)
            // Both the JPEGTable and the Bytes with have the start of image and end of image markers

            // SOI 0xffd8 EOI 0xffd9
            // Remove EndOfImage marker
            const tableData = tables.slice(0, tables.length - 2);
            const actualBytes = new Uint8Array(bytes.byteLength + tableData.length - 2);
            actualBytes.set(tableData, 0)
            actualBytes.set(bytes.slice(2), tableData.length);

            return { mimeType, bytes: actualBytes }
        }
        return { mimeType, bytes: new Uint8Array(bytes) };
    }

    async processIfd(offset: number) {
        const { image, nextOffset } = await this.readIfd(offset);
        this.images.push(image);
        const size = image.size;
        const tile = image.tileInfo;
        if (tile == null) {
            Logger.warn('Tiff is not tiled');
        } else {
            Logger.debug(
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
            Logger.trace({ offset: toHexString(nextOffset) }, 'NextImageOffset');
            await this.source.loadBytes(nextOffset, 1024);
            await this.processIfd(nextOffset);
        }
    }

    private async readIfd(offset: number) {
        const view = this.source.getView(offset);
        const tagCount = view.offset();
        const byteStart = offset + this.source.config.offset;
        const logger = Logger.child({ imageId: this.images.length });
        const image = new CogTifImage(this.images.length, byteStart);

        let pos = byteStart;
        for (let i = 0; i < tagCount; i++) {
            const tag = CogTifTag.create(this.source, pos);
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
            image.tags.set(tag.id, tag);
        }
        const nextOffset = await this.source.pointer(pos);
        return { nextOffset, image };
    }
}
