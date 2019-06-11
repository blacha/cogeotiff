import { CogSource } from '../cog.source';

export class CogSourceUrl extends CogSource {
    chunkSize = 64 * 1024;

    url: string;

    batches = [];
    toFetch: boolean[];
    toFetchPromise: Promise<ArrayBuffer[]>;

    constructor(url: string) {
        super();
        this.url = url;
        this.toFetch = [];
    }

    get name() {
        return this.url.split('/').pop()
    }

    static getByteRanges(ranges: string[]) {
        if (ranges.length === 0) {
            return [];
        }
        const sortedRange = ranges.map(c => parseInt(c, 10)); //.sort((a, b) => a - b);

        const groups = [];
        let current = [];
        groups.push(current);

        for (let i = 0; i < sortedRange.length; ++i) {
            if (i === 0 || sortedRange[i] === sortedRange[i - 1] + 1) {
                current.push(sortedRange[i]);
            } else {
                current = [sortedRange[i]];
                groups.push(current);
            }
        }
        return groups;
    }

    async fetchData(): Promise<ArrayBuffer[]> {

        const chunkIds = Object.keys(this.toFetch);
        this.toFetch = [];
        delete this.toFetchPromise;

        const fetches: Promise<void>[] = []
        const chunks = CogSourceUrl.getByteRanges(chunkIds);
        const output: ArrayBuffer[] = [];

        for (const chunkRange of chunks) {
            const firstChunk = chunkRange[0];
            const lastChunk = chunkRange[chunkRange.length - 1];
            const fetchRange = `bytes=${firstChunk * this.chunkSize}-${lastChunk * this.chunkSize + this.chunkSize}`;

            // console.log('FetchRange', fetchRange, 'chunks', chunkRange)
            const promise = CogSourceUrl.fetch(this.url, {
                headers: {
                    Range: fetchRange,
                },
            }).then(async response => {
                const buffer: ArrayBuffer = await response.arrayBuffer();
                if (chunkRange.length == 1) {
                    output[chunkRange[0]] = buffer;
                    return;
                }

                const rootOffset = firstChunk * this.chunkSize;
                for (const chunkId of chunkRange) {
                    const chunkOffset = chunkId * this.chunkSize - rootOffset;
                    // console.log(chunkId, chunkOffset, 'fromBuffer', buffer.byteLength)
                    output[chunkId] = buffer.slice(chunkOffset, chunkOffset + this.chunkSize)
                }
            });

            fetches.push(promise);
        }

        await Promise.all(fetches)
        return output;
    }

    async fetchBytes(offset: number, count: number): Promise<ArrayBuffer> {
        const startChunk = Math.floor(offset / this.chunkSize);
        const endChunk = Math.floor((offset + count) / this.chunkSize) - 1;
        if (startChunk != endChunk) {
            console.log('RequestTooLarge');
            return null;
        }

        this.toFetch[startChunk] = true;

        if (this.toFetchPromise == null) {
            this.toFetchPromise = new Promise<void>(resolve => setTimeout(resolve, 5)).then(() => this.fetchData());
        }

        return this.toFetchPromise.then(results => results[startChunk])
    }

    static fetch: GlobalFetch["fetch"];
}

