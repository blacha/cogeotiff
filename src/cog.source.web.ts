import { CogSource } from './cog.source'
import { toHexString } from './util.hex';

export class CogFileSource extends CogSource {

    url: string;

    constructor(url: string) {
        super();
        this.url = url;
    }

    async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        const response = await fetch(this.url, {
            headers: {
                Range: `bytes=${offset}-${offset + length}`,
            },
        });
        return response.arrayBuffer();
    }
}

