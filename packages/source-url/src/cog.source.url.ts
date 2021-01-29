import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { CogTiff } from '@cogeotiff/core';

export class CogSourceUrl extends ChunkSource {
    type = 'url';

    static DefaultChunkSize = 32 * 1024;
    chunkSize: number = CogSourceUrl.DefaultChunkSize;

    uri: string;

    constructor(uri: string) {
        super();
        this.uri = uri;
    }

    get name(): string {
        return this.uri;
    }

    static isSource(source: ChunkSource): source is CogSourceUrl {
        return source.type === 'url';
    }

    /**
     * Create and initialize a COG from a url
     *
     * @param url location of the cog
     */
    static async create(url: string): Promise<CogTiff> {
        return new CogTiff(new CogSourceUrl(url)).init();
    }

    async fetchBytesZ(offset: number, length: number, logger?: LogType): Promise<ArrayBuffer> {
        const Range = `bytes=${offset}-${offset + length}`;
        const headers = { Range };
        const response = await CogSourceUrl.fetch(this.uri, { headers });

        if (!response.ok) {
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

        return await response.arrayBuffer();
    }

    // Allow overwriting the fetcher used (eg testing/node-js)
    static fetch: WindowOrWorkerGlobalScope['fetch'] = (a, b) => fetch(a, b);
}
