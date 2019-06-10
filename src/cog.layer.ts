import { promises as fs } from 'fs';
import { TIFF_SIZE, TIFF_TAG, TIFF_COMPRESSION } from './globals';

const VERSION_TIFF = 42;
const VERSION_BIGTIFF = 43;

const ENDIAN_BIG = 0x4D4D
const ENDIAN_LITTLE = 0x4949

const BUFFER_SIZE = Math.pow(2, 16) // 32kb

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

const CogTagProcess = {
    [TIFF_TAG.compression]: (compression: number, img: CogImage) => TIFF_COMPRESSION[compression] || 'application/octlet-stream',
}

class CogLayer {

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
            const code = await this.source.uint16(pos)
            if (TIFF_TAG[code] == null) {
                continue;
            }

            const type = await this.source.uint16(pos + 2);
            const typeSize = TIFF_SIZE[type]

            const count = await this.source.uint32(pos + 4)
            const tagLen = count * typeSize.length

            console.log(pos - 10, 'tag', TIFF_TAG[code], 'type', type, 'typeCount', count, 'tagLen', tagLen)

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

            tags.push({ code, count, value, type: typeSize })
        }

        const nextOffsetPtr = offset + tagCount * 12 + 2;
        console.log('nextOffset', nextOffsetPtr)
        return {
            nextOffset: await this.source.uint32(nextOffsetPtr),
            tags
        }
    }
}

interface CogTiffTag {
    code: number;
    count: number;
    value: any; //number | () => Promise<Buffer>;
    type: any;
}


abstract class CogSource {
    _bytes: { buffer: Buffer, offset: number }[] = [];

    async uint16(offset: number) {
        const buff = await this.getInternalBuffer(offset, 2);
        return buff.buffer.readUInt16LE(offset - buff.offset)
    }

    async uint32(offset: number) {
        const buff = await this.getInternalBuffer(offset, 4);
        return buff.buffer.readUInt32LE(offset - buff.offset)
    }

    async getBytes(offset: number, count: number) {
        const buff = await this.getInternalBuffer(offset, 2);
        return buff.buffer.subarray(offset - buff.offset, count)
    }

    hasBytes(offset: number, count = 1) {
        for (const data of this._bytes) {
            if (offset < data.offset) {
                continue;
            }
            if (offset + count > data.offset + data.buffer.length) {
                continue;
            }
            return true;
        }
        return false;
    }

    // TODO will cause errors if fetching at edge of range
    protected async getInternalBuffer(offset: number, count: number) {
        for (const data of this._bytes) {
            if (offset < data.offset) {
                continue;
            }
            if (offset + count > data.offset + data.buffer.length) {
                continue;
            }
            return data;
        }
        const buffer = await this.fetchBytes(offset, BUFFER_SIZE);
        const node = { buffer, offset };
        this._bytes.push(node)
        return node;
    }

    protected abstract fetchBytes(offset: number, length: number): Promise<Buffer>
}


// class UrlSource extends CogSource {
//     url: string;
//     constructor(url: string) {
//         super();
//         this.url = url;
//     }
//     async fetchBytes(offset: number, length: number): Promise<Buffer> {
//         const response = await fetch(this.url, {
//             headers: {
//                 Range: `bytes=${offset}-${offset + length}`,
//             }
//         });

//         if (response.status !== 206) {
//             throw new Error('Failed to fetch')
//         }
//         return await response.buffer();
//     }
// }

class FileSource extends CogSource {

    fileName: string;
    fd: Promise<fs.FileHandle>;

    constructor(fileName: string) {
        super();
        this.fileName = fileName;
        this.fd = fs.open(this.fileName, 'r');
    }

    async fetchBytes(offset: number, length: number): Promise<Buffer> {
        // TODO cache fs.open
        const fd = await this.fd;

        const { buffer } = await fd.read(Buffer.alloc(length), 0, length, offset);
        console.log('read', offset, length)
        return buffer
    }
}




async function run() {
    // const cl = new CogLayer(new FileSource('./src/7ad397c0-bba2-4f98-a08a-931ec3a6e943.tif'))
    // const cl = new CogLayer(new FileSource('/home/blacha/Downloads/tif/7ad397c0-bba2-4f98-a08a-931ec3a6e943.tif'))
    const cl = new CogLayer(new FileSource('/home/blacha/Downloads/tif/land_shallow_topo_east.cog.webp.tif'))

    await cl.init();
}

run().catch(console.error.bind(console))
