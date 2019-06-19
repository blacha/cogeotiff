import * as o from 'ospec';
import { CogSourceUrl } from '../src/source/cog.source.web';

import 'source-map-support/register';
import { LoggerConfig } from '../src/util/util.log';
import { LogLevel } from 'bblog';

LoggerConfig.level = 99 as LogLevel;

export interface HttpHeaders {
    Range: string;
}

function getCB(source: CogSourceUrl, index: number) {
    const chnk = source._chunks[index];
    if (chnk.isReady()) {
        return chnk._buffer;
    }
    throw Error(`Missing chunk ${index}`);
}

o.spec('CogSourceUrl', () => {
    let source: CogSourceUrl;
    let ranges: string[];

    // FAke fetch that returns the number of the byte that was requested
    CogSourceUrl.fetch = (url: string, obj: Record<string, HttpHeaders>) => {
        const [startByte, endByte] = obj.headers.Range.split('=')[1]
            .split('-')
            .map(i => parseInt(i, 10));
        const bytes = [];
        ranges.push(obj.headers.Range);
        for (let i = startByte; i < endByte; i++) {
            bytes.push(i);
        }
        const buffer = new Uint8Array(bytes).buffer;
        const arrayBuffer = () => Promise.resolve(buffer);
        return Promise.resolve({ arrayBuffer }) as any;
    };

    o.beforeEach(() => {
        source = new CogSourceUrl('https://foo');
        source.chunkSize = 1;
        ranges = [];
    });

    o('should get some data', async () => {
        await source.loadBytes(0, 1);
        o(Object.keys(source._chunks)).deepEquals(['0']);
        o(source._chunks[0].offset).equals(0);
        o(source._chunks[0].offsetEnd).equals(1);
    });

    o('should group fetches together', async () => {
        await source.loadBytes(0, 2);

        o(Object.keys(source._chunks)).deepEquals(['0', '1']);
        const viewA = new DataView(getCB(source, 0));
        const viewB = new DataView(getCB(source, 1));

        o(viewA.getUint8(0)).equals(0);
        o(viewB.getUint8(0)).equals(1);
    });

    o('should group big fetches', async () => {
        await source.loadBytes(0, 2);
        await source.loadBytes(0, 5);

        o(Object.keys(source._chunks)).deepEquals(['0', '1', '2', '3', '4']);

        for (let i = 0; i < 5; i++) {
            o(source.uint8(i)).equals(i);

            o(source._chunks[i].view.getUint8(0)).equals(i);
        }
    });

    o('should handle bigger buffers', async () => {
        const MAX_BYTE = 256;
        source.chunkSize = 32;

        await source.loadBytes(0, MAX_BYTE);

        o(Object.keys(source._chunks)).deepEquals(['0', '1', '2', '3', '4', '5', '6', '7']);

        for (let i = 0; i < MAX_BYTE; i++) {
            o(source.uint8(i)).equals(i);
        }

        for (let i = 0; i < MAX_BYTE / source.chunkSize; i++) {
            const view = new DataView(getCB(source, i));
            for (let x = 0; x < source.chunkSize; x++) {
                o(view.getUint8(x)).equals(i * source.chunkSize + x);
            }
        }
    });

    o('should handle part requests', async () => {
        source.chunkSize = 2;
        await source.loadBytes(2, 3);

        o(source.uint8(2)).equals(2);
        o(source.uint8(3)).equals(3);
        o(source.uint8(4)).equals(4);

        o(getCB(source, 1).byteLength).equals(2);
        o(getCB(source, 2).byteLength).equals(2);
    });

    o('should handle out of order requests', async () => {
        source.chunkSize = 2;
        await Promise.all([source.loadBytes(8, 3), source.loadBytes(1, 3)]);

        o(source.uint8(0)).equals(0);
        o(source.uint8(1)).equals(1);
        o(source.uint8(2)).equals(2);
        o(source.uint8(8)).equals(8);
        o(source.uint8(9)).equals(9);
        o(source.uint8(10)).equals(10);
    });
});
