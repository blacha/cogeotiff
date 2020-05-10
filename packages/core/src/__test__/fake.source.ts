import { readFileSync } from 'fs';
import { CogSource } from '../source/cog.source';

export class FakeCogSource extends CogSource {
    type = 'fake';
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

export class TestFileCogSource extends CogSource {
    type = 'test-file';
    chunkSize: number = 1024 * 1024 * 1024;
    name: string;
    fileName: string;
    data: Buffer;

    constructor(fileName: string) {
        super();
        this.fileName = fileName;
        this.name = 'Fake:' + this.fileName;
        this.data = readFileSync(this.fileName);
    }
    async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        return this.data.slice(offset).buffer;
    }
}
