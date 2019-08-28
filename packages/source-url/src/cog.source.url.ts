/// <reference lib="dom" />
import { CogLogger, CogSource, CogSourceChunked, CogTiff } from '@coginfo/core';

export class CogSourceUrl extends CogSourceChunked {
    type = 'url';

    chunkSize: number = 32 * 1024;
    maxChunkCount: number = 32;

    delayMs = 5;

    url: string;

    constructor(url: string) {
        super();
        this.url = url;
    }

    get name() {
        return this.url;
    }

    static isSource(source: CogSource): source is CogSourceUrl {
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

    protected async loadChunks(firstChunk: number, lastChunk: number, logger: CogLogger): Promise<ArrayBuffer> {
        const Range = `bytes=${firstChunk * this.chunkSize}-${lastChunk * this.chunkSize + this.chunkSize}`;
        const chunkCount = lastChunk - firstChunk || 1;

        logger.info(
            { firstChunk, lastChunk, chunkCount, bytes: chunkCount * this.chunkSize, fetchRange: Range },
            'HTTPGet',
        );

        const headers = { Range };
        const response = await CogSourceUrl.fetch(this.url, { headers });

        if (!response.ok) {
            logger.error(
                {
                    status: response.status,
                    statusText: response.statusText,
                    url: this.url,
                },
                'Failed to fetch',
            );
            throw new Error('Failed to fetch');
        }

        return await response.arrayBuffer();
    }

    // Allow overwriting the fetcher used (eg testing/node-js)
    static fetch: GlobalFetch['fetch'] = (a, b) => fetch(a, b);
}
