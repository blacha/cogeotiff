import { promises as fs } from 'fs';
import { CogSource } from '../cog.source'
import { toHexString } from '../util/util.hex';
import { basename } from 'path';

export class CogSourceFile extends CogSource {
    chunkSize = 16 * 1024;

    fileName: string;
    fd: Promise<fs.FileHandle>;

    constructor(fileName: string) {
        super();
        this.fileName = fileName;
    }

    get name() {
        return basename(this.fileName);
    }

    async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        if (this.fd == null) {
            this.fd = fs.open(this.fileName, 'r');
        }
        const fd = await this.fd;
        const { buffer } = await fd.read(Buffer.alloc(length), 0, length, offset);
        return buffer.buffer
    }
}

