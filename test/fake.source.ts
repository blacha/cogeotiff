import { CogSource } from "../src";

export class FakeCogSource extends CogSource {
    chunkSize: number = 100;

    fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = offset + i;
        }
        return Promise.resolve(bytes.buffer);
    }

    name: string = 'FakeSource';
}
