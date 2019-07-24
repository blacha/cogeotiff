import { Logger } from '../util/util.log';
import { CogSourceChunked } from './cog.source.chunked';

export class CogSourceUrl extends CogSourceChunked {
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

    async loadChunks(chunks: number[][]): Promise<ArrayBuffer[]> {
        const output: ArrayBuffer[] = [];

        for (const chunkRange of chunks) {
            const firstChunk = chunkRange[0];
            const lastChunk = chunkRange[chunkRange.length - 1];
            const fetchRange = `bytes=${firstChunk * this.chunkSize}-${lastChunk * this.chunkSize + this.chunkSize}`;
            const chunkCount = lastChunk - firstChunk || 1;

            Logger.info(
                { firstChunk, lastChunk, chunkCount, bytes: chunkCount * this.chunkSize, fetchRange },
                'HTTPGet',
            );

            // TODO putting this in a promise queue to do multiple requests
            // at a time would be a good idea.
            const response = await CogSourceUrl.fetch(this.url, {
                headers: {
                    Range: fetchRange,
                },
            });

            if (!response.ok) {
                Logger.error(
                    {
                        status: response.status,
                        statusText: response.statusText,
                        url: this.url,
                    },
                    'Failed to fetch',
                );
                throw new Error('Failed to fetch');
            }

            const buffer: ArrayBuffer = await response.arrayBuffer();
            if (chunkRange.length == 1) {
                output[chunkRange[0]] = buffer;
                continue;
            }

            const rootOffset = firstChunk * this.chunkSize;
            for (const chunkId of chunkRange) {
                const chunkOffset = chunkId * this.chunkSize - rootOffset;
                output[chunkId] = buffer.slice(chunkOffset, chunkOffset + this.chunkSize);
            }
        }

        return output;
    }

    // Allow overwriting the fetcher used (eg testing/node-js)
    static fetch: GlobalFetch['fetch'] = (a, b) => fetch(a, b);
}
