import { promises as fs } from 'fs';
import { basename } from 'path';
import { CogSource, CogTif } from '@coginfo/core';

const SourceType = 'file';

export class CogSourceFile extends CogSource {
    type = SourceType;

    static DEFAULT_CHUNK_SIZE = 16 * 1024;
    chunkSize: number;

    fileName: string;
    fd: Promise<fs.FileHandle> | null = null;

    static isSource(source: CogSource): source is CogSourceFile {
        return source.type === SourceType;
    }
    /**
     * Create and initialize a COG from a file path
     *
     * @param filePath location of the cog
     */
    static async create(filePath: string): Promise<CogTif> {
        return new CogTif(new CogSourceFile(filePath)).init();
    }

    constructor(fileName: string) {
        super();
        this.fileName = fileName;
        this.chunkSize = CogSourceFile.DEFAULT_CHUNK_SIZE;
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
