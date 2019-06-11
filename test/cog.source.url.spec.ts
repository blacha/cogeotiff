import * as o from 'ospec';
import { CogSourceUrl } from '../src/cog.source.web';

import 'source-map-support/register';

o.spec('CogSourceUrl', () => {

    // FAke fetch that returns the number of the byte that was requested
    CogSourceUrl.fetch = (url: string, obj) => {
        const [startByte, endByte] = obj.headers['Range'].split('=')[1].split('-').map(i => parseInt(i, 10));
        const bytes = [];
        ranges.push(obj.headers['Range']);
        for (let i = startByte; i < endByte; i++) {
            bytes.push(i);
        }
        const buffer = new Uint8Array(bytes).buffer;
        const arrayBuffer = () => Promise.resolve(buffer);
        return Promise.resolve({ arrayBuffer }) as any;
    }

    let source: CogSourceUrl;
    let ranges: string[];
    o.beforeEach(() => {
        source = new CogSourceUrl('https://foo');
        source._chunkSize = 1;
        ranges = [];
    })

    o('should get some data', async () => {
        await source.getBytes(0, 1);
        o(Object.keys(source._chunks)).deepEquals(['0'])
        o(source._chunks[0].offset).equals(0);
        o(source._chunks[0].offsetEnd).equals(1);
    })

    o('should group fetches together', async () => {
        await source.getBytes(0, 2);

        o(Object.keys(source._chunks)).deepEquals(['0', '1'])
        const viewA = new DataView(source._chunks[0].buffer)
        const viewB = new DataView(source._chunks[1].buffer)

        o(viewA.getUint8(0)).equals(0)
        o(viewB.getUint8(0)).equals(1)
    });

    o('should group big fetches', async () => {
        const bytes02 = await source.getBytes(0, 2);
        const bytes05 = await source.getBytes(0, 5);
        const bytes05View = new DataView(bytes05);

        o(Object.keys(source._chunks)).deepEquals(['0', '1', '2', '3', '4'])

        for (let i = 0; i < 5; i++) {
            const view = new DataView(source._chunks[i].buffer)
            o(bytes05View.getUint8(i)).equals(i);
            o(view.getUint8(0)).equals(i)
        }
    })


    o('should handle bigger buffers', async () => {
        const MAX_BYTE = 256;
        source._chunkSize = 32;

        const bytesAll = await source.getBytes(0, MAX_BYTE);
        const bytesView = new DataView(bytesAll);

        o(Object.keys(source._chunks)).deepEquals(['0', '1', '2', '3', '4', '5', '6', '7'])

        for (let i = 0; i < MAX_BYTE; i++) {
            o(bytesView.getUint8(i)).equals(i);
        }

        for (let i = 0; i < MAX_BYTE / source._chunkSize; i++) {
            const view = new DataView(source._chunks[i].buffer)
            for (let x = 0; x < source._chunkSize; x++) {
                o(view.getUint8(x)).equals(i * source._chunkSize + x);
            }
        }
    })

    o('should handle part requests', async () => {
        source._chunkSize = 2
        const result = await source.getBytes(2, 3);
        const bytesResult = new DataView(result);

        o(bytesResult.getUint8(0)).equals(2)
        o(bytesResult.getUint8(1)).equals(3)
        o(bytesResult.getUint8(2)).equals(4)
        o(bytesResult.byteLength).equals(3)

        o(source._chunks[1].buffer.byteLength).equals(2);
        o(source._chunks[2].buffer.byteLength).equals(2);
    })

    o('should handle out of order requests', async () => {

        source._chunkSize = 2;
        const [resA, resB] = await Promise.all([
            source.getBytes(8, 3),
            source.getBytes(1, 3)
        ])

        const viewA = new DataView(resA);
        const viewB = new DataView(resB);
        o(viewA.getUint8(0)).equals(8)
        o(viewA.getUint8(1)).equals(9)
        o(viewA.getUint8(2)).equals(10)
        o(viewB.getUint8(0)).equals(1)
        o(viewB.getUint8(1)).equals(2)
        o(viewB.getUint8(2)).equals(3)
    })

})
