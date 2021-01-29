import * as fs from 'fs';
import { ChunkSource } from '../chunk.source';

export class FakeChunkSource extends ChunkSource {
    type = 'fake';
    uri = 'fake';
    chunkSize = 100;

    async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = offset + i;
        }
        return Promise.resolve(bytes.buffer);
    }

    name = 'FakeSource';
}

let Id = 0;
export class TestFileChunkSource extends ChunkSource {
    id = Id++;
    type = 'test-file';
    uri = '/test/file';
    chunkSize: number = 1024 * 1024 * 1024;
    name: string;
    fileName: string;

    constructor(fileName: string) {
        super();
        this.fileName = fileName;
        this.name = `Fake:${this.id}:` + this.fileName;
    }
    async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        const fileData = await fs.promises.readFile(this.fileName);
        return fileData.buffer.slice(fileData.byteOffset + offset, fileData.byteOffset + length);
    }
}
