import { CogSource } from './cog.source';
import { TiffCompression } from './tif';
import { toHexString } from './util.hex';

export enum TiffVersion {
    BigTiff = 43,
    Tiff = 42
}

export const ENDIAN_BIG = 0x4D4D
export const ENDIAN_LITTLE = 0x4949

export interface CogImage {
    Compression: number;
    ImageWidth: number;
    ImageHeight: number;
    TileWidth: number;
    TileHeight: number;
    TileOffsets: number[];
    TileByteCounts: number[];
}

export class CogTif {
    source: CogSource;
    version: number;
    images: Partial<CogImage>[] = [];

    constructor(source: CogSource) {
        this.source = source;
    }

    async init() {
        await this.fetchIfd();
    }

    async fetchIfd() {
        const endian = await this.source.uint16(0);
        this.source.isLittleEndian = endian === ENDIAN_LITTLE;
        if (!this.source.isLittleEndian) {
            throw new Error('Only little endian is supported');
        }
        this.version = await this.source.uint16(2);

        let offset: number;
        if (this.version == TiffVersion.BigTiff) {
            const pointerSize = await this.source.uint16(4);
            if (pointerSize !== 8) {
                throw new Error('Only 8byte pointers are supported');
            }
            this.source.setVersion(TiffVersion.BigTiff);
            offset = await this.source.pointer(8);
            return await this.processIfd(offset);
        }

        if (this.version === TiffVersion.Tiff) {
            this.source.setVersion(TiffVersion.Tiff)
            offset = await this.source.pointer(4);
            return await this.processIfd(offset);
        }

        throw new Error(`Only tiff supported version:${this.version}`);
    }

    async getTileRaw(x: number, y: number, z: number): Promise<{ mimeType: string; bytes: ArrayBuffer; }> {
        const image = this.images[z];
        if (image == null) {
            throw new Error(`Missing z: ${z}`);
        }
        const mimeType = TiffCompression[image.Compression];
        const nyTiles = Math.ceil(image.ImageHeight / image.TileHeight);
        const idx = y * nyTiles + x;

        if (idx > image.TileOffsets.length) {
            throw new Error(`Tile ${x} ${y} ${z} does not exist`);
        }

        const offset = image.TileOffsets[idx];
        const byteCount = image.TileByteCounts[idx];
        // TODO fix JPEG
        const bytes = await this.source.getBytes(offset, byteCount);
        return { mimeType, bytes };
    }

    async processIfd(offset: number) {
        const ifd = await this.readIfd(offset);
        this.images.push(ifd.image);

        console.log('GotImage', ifd.image.ImageWidth, 'x', ifd.image.ImageHeight, '\tTile:', ifd.image.TileWidth, 'x', ifd.image.TileHeight, `\tNext: ${toHexString(ifd.nextOffset, 6)}`)
        // console.log(ifd.image);
        // TODO dynamically load these as needed

        if (ifd.nextOffset) {
            await this.processIfd(ifd.nextOffset);
        }
    }

    private async readIfd(offset: number) {
        // console.time('ifd:' + offset);
        const tagCount = await this.source.offset(offset)
        const byteStart = offset + this.source.config.offset;

        const image: Partial<CogImage> = {};
        let isPartial = false;

        // console.log(`ReadIFD: ${offset} @ ${byteStart} (${tagCount})`);
        let pos = byteStart;
        for (let i = 0; i < tagCount; i++) {
            const tag = await this.source.tag(pos);
            pos += tag.size;

            if (tag.codeName == null) {
                console.log(`Unknown code ${tag.code}`);
                continue;
            }

            // console.log(pos - offset, 'tag', tag.code, 'type', tag.codeName, 'typeCount', tag.count, 'tagLen', tag.typeLength, 'size', tag.size);
            if (typeof tag.value === 'function') {
                const pointer = await this.source.pointer(tag.valueOffset);
                console.error(`\tIFD: ${tag.codeName} needs more data ${toHexString(tag.valueOffset, 6)} -> ${toHexString(pointer)} chunks:[${this.source.getRequiredChunks(pointer, tag.typeLength).length}]`);
                isPartial = true;
                continue;
            }
            image[tag.codeName] = tag.value;
        }
        image['_isPartial'] = isPartial;
        const nextOffset = await this.source.pointer(pos);
        // console.timeEnd('ifd:' + offset);
        return { nextOffset, image };
    }
}
