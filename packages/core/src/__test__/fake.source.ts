import * as fs from 'fs';
import { CogSource } from '../source/cog.source';

export class FakeCogSource extends CogSource {
    type = 'fake';
    uri = 'fake';
    chunkSize = 100;

    fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = offset + i;
        }
        return Promise.resolve(bytes.buffer);
    }

    name = 'FakeSource';
}

let Id = 0;
export class TestFileCogSource extends CogSource {
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
        return fileData.buffer.slice(fileData.byteOffset + offset, fileData.byteOffset + fileData.byteLength);
    }
}
