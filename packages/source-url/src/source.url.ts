import { ChunkSource, LogType } from '@cogeotiff/chunk';

export class SourceUrl extends ChunkSource {
    type = 'url';

    static DefaultChunkSize = 32 * 1024;
    chunkSize: number = SourceUrl.DefaultChunkSize;

    uri: string;

    constructor(uri: string) {
        super();
        this.uri = uri;
    }

    get name(): string {
        return this.uri;
    }

    static isSource(source: ChunkSource): source is SourceUrl {
        return source.type === 'url';
    }

    async fetchAllBytes(logger?: LogType): Promise<ArrayBuffer> {
        const response = await SourceUrl.fetch(this.uri);

        if (response.ok) return response.arrayBuffer();

        logger?.error({ status: response.status, statusText: response.statusText, url: this.uri }, 'Failed to fetch');
        throw new Error('Failed to fetch');
    }

    async fetchBytes(offset: number, length: number, logger?: LogType): Promise<ArrayBuffer> {
        const Range = `bytes=${offset}-${offset + length}`;
        const headers = { Range };
        const response = await SourceUrl.fetch(this.uri, { headers });

        if (response.ok) return response.arrayBuffer();
        logger?.error(
            {
                offset,
                bytes: length,
                status: response.status,
                statusText: response.statusText,
                url: this.uri,
            },
            'Failed to fetch',
        );

        throw new Error('Failed to fetch');
    }

    // Allow overwriting the fetcher used (eg testing/node-js)
    static fetch: WindowOrWorkerGlobalScope['fetch'] = (a, b) => fetch(a, b);
}
