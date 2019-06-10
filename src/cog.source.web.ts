import { CogSource } from './cog.source';

declare var fetch: any;

export class CogSourceUrl extends CogSource {

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

