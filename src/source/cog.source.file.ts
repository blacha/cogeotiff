import { promises as fs } from 'fs';
import { basename } from 'path';
import { CogSource } from '../cog.source';

export class CogSourceFile extends CogSource {
    chunkSize = 16 * 1024;

    fileName: string;
    fd: Promise<fs.FileHandle> | null = null;

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
        return buffer.buffer;
    }
}
