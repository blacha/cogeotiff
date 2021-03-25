import { ChunkSource } from './chunk.source';

export class SourceMemory extends ChunkSource {
    chunkSize = -1;
    uri: string;
    name: string;
    type = 'memory';
    data: ArrayBuffer;

    constructor(name: string, bytes: ArrayBuffer) {
        super();
        this.name = name;
        this.uri = `memory://${name}`;
        this.data = bytes;
        this.chunkSize = bytes.byteLength;
        this.chunks.set(0, new DataView(bytes));
    }
    protected async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        return this.data.slice(offset, offset + length);
    }
    protected async fetchAllBytes(): Promise<ArrayBuffer> {
        return this.data;
    }
}
