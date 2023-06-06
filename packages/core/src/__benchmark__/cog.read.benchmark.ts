import { readFile } from 'fs/promises';
import { CogTiff } from '../cog.tiff.js';
import { CogSource } from '../source.js';

/** Read a tile from every image inside of a tiff 300 tiles read */
async function main(): Promise<void> {
    const buf = await readFile(process.argv[process.argv.length - 1]);
    const source = new SourceMemory(new URL('memory://buffer'), buf);
    for (let i = 0; i < 5_000; i++) {
        const tiff = new CogTiff(source);
        await tiff.init();

        // 6 images
        for (const img of tiff.images) await img.getTile(0, 0);
    }
}

main();
//

export class SourceMemory implements CogSource {
    url: URL;
    name: string;
    type = 'memory';
    data: ArrayBuffer;

    static toArrayBuffer(buf: Buffer | Uint8Array | ArrayBuffer): ArrayBuffer {
        if (buf instanceof ArrayBuffer) return buf;
        if (buf.byteLength === buf.buffer.byteLength) return buf.buffer;
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }

    constructor(name: URL, bytes: Buffer | Uint8Array | ArrayBuffer) {
        const buf = SourceMemory.toArrayBuffer(bytes ?? new Uint8Array());
        this.url = name;
        this.data = buf;
    }

    async fetchBytes(offset: number, length?: number): Promise<ArrayBuffer> {
        if (offset < 0) offset = this.data.byteLength + offset;
        return this.data.slice(offset, length == null ? undefined : offset + length);
    }
}
