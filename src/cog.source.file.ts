import { promises as fs } from 'fs';
import { CogSource } from './cog.source'
import { toHexString } from './util.hex';

export class CogFileSource extends CogSource {

    fileName: string;
    fd: Promise<fs.FileHandle>;

    constructor(fileName: string) {
        super();
        this.fileName = fileName;
        this.fd = fs.open(this.fileName, 'r');
    }

    async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        const fd = await this.fd;
        const { buffer } = await fd.read(Buffer.alloc(length), 0, length, offset);
        console.log('read', toHexString(offset), toHexString(length), '->', toHexString(offset + length))
        return buffer.buffer
    }
}

