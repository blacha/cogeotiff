import { TIFF_SIZE, TIFF_TAG, TIFF_COMPRESSION, TIFF_TAG_TYPE } from './tif';
import { CogFileSource } from './cog.source.file';

const VERSION_TIFF = 42;
const VERSION_BIGTIFF = 43;

const ENDIAN_BIG = 0x4D4D
const ENDIAN_LITTLE = 0x4949

interface CogImage {
    width: number;
    height: number;
    mimeType: string;
    tileWidth: number;
    tileHeight: number;
    offsets: number[];
    tileBytes: number[];
    jpegTables: Buffer;
}

interface CogTiffTag {
    code: number;
    count: number;
    value: any; //number | () => Promise<Buffer>;
    type: any;
}

const CogTagProcess = {
    [TIFF_TAG.compression]: (compression: number, img: CogImage) => TIFF_COMPRESSION[compression] || 'application/octlet-stream',
}

export class CogLayer {

    source: CogSource;
    version: number;
    isLittleEndian: boolean;
    isBigTiff = false;

    constructor(source: CogSource) {
        this.source = source
    }

    async init() {
        await this.fetchHeader();
    }

    async fetchHeader() {
        const endian = await this.source.uint16(0);

        this.isLittleEndian = endian === ENDIAN_LITTLE
        if (!this.isLittleEndian) {
            throw new Error('Only little endian is supported');
        }

        this.version = await this.source.uint16(2);
        if (this.version == VERSION_BIGTIFF) {
            throw new Error(`Only tiff supported version:${this.version}`)
        }

        if (this.version != VERSION_TIFF) {
            throw new Error(`Only tiff supported version:${this.version}`)
        }

        const offset = await this.source.uint32(4);

        if (!this.source.hasBytes(offset)) {
            throw new Error('Offset out of range');
        }

        await this.processIfd(offset);
    }

    async processIfd(offset: number) {
        const ifd = await this.readIfd(offset);
        const cogImage: Partial<CogImage> = {};
        for (const tag of ifd.tags) {
            const processor = CogTagProcess[tag.code];
            if (processor == null && typeof tag.value === 'number') {
                cogImage[TIFF_TAG[tag.code]] = tag.value
                continue;
            }
            if (typeof tag.value === 'number') {
                cogImage[TIFF_TAG[tag.code]] = processor(tag.value, cogImage);
            }
        }

        // if (cogImage.offsets == null || cogImage.offsets.length === 0) {
        //     throw new Error('Invalid IFD');
        // }
        console.log(cogImage);

        if (ifd.nextOffset) {
            await this.processIfd(ifd.nextOffset);
        }
    }

    async readIfd(offset: number) {
        const tagCount = await this.source.uint16(offset);

        const byteStart = offset + 2;
        const byteEnds = tagCount * 12 + 2 + byteStart;

        let pos = 0;
        const tags: CogTiffTag[] = [];

        console.log(`${offset} @ ${byteStart} - ${byteEnds} ${tagCount}`);
        for (let i = 0; i < tagCount; i++) {
            pos = byteStart + 12 * i;
            const tagCode = await this.source.uint16(pos)
            if (TIFF_TAG[tagCode] == null) {
                continue;
            }

            const tagType = await this.source.uint16(pos + 2);
            const typeSize = TIFF_SIZE[tagType]

            const count = await this.source.uint32(pos + 4)
            const tagLen = count * typeSize.length

            console.log(pos - 10, 'tag', TIFF_TAG[tagCode], 'type', TIFF_TAG_TYPE[tagType], 'typeCount', count, 'tagLen', tagLen)

            let value: any = null;
            if (tagLen <= 4) {
                value = await this.source.uint32(pos + 8)
            } else {
                const valueOffset = await this.source.uint32(pos + 8);
                const valueEnd = valueOffset + tagLen;
                if (!this.source.hasBytes(valueOffset, tagLen)) {
                    console.error(`Need More data ${valueEnd} >`);
                }
                value = () => this.source.getBytes(valueOffset, tagLen);
            }

            tags.push({ code: tagCode, count, value, type: typeSize })
        }

        const nextOffsetPtr = offset + tagCount * 12 + 2;
        console.log('nextOffset', nextOffsetPtr)
        return {
            nextOffset: await this.source.uint32(nextOffsetPtr),
            tags
        }
    }
}

