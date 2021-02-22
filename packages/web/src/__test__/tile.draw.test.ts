import 'source-map-support/register';
import * as o from 'ospec';
import { CogTiff } from 'packages/core/src/cog.tiff';
import { drawTile } from '../tiles/tile.draw';
import { Composition } from '../tiles/tiler';
import { CogTiffImage, Size } from '@cogeotiff/core';
import { Bounds } from '@basemaps/geo';

export class FakeCogTiffImage extends CogTiffImage {
    constructor() {
        super(null as any, 1, new Map());
    }
    get tileSize(): Size {
        return { width: 256, height: 256 };
    }

    get size(): Size {
        return { width: 2048, height: 2048 };
    }
}

o.spec('TileDraw', () => {
    const fakeCanvasCtx = {
        canvas: 'FakeCanvas',
        draws: [] as any[],
        drawImage(...args: any[]): void {
            this.draws.push(args);
        },
        clears: [] as any[],
        clearRect(...args: any[]): void {
            this.clears.push(args);
        },
    };

    const fakeCanvas = {
        getContext() {
            return fakeCanvasCtx;
        },
    } as any;

    function fakeCog(): CogTiff {
        const img = new FakeCogTiffImage();
        return {
            id: 'FakeCog',
            getImage() {
                return img;
            },
        } as any;
    }

    function makeComp(tiff: CogTiff): Composition {
        return {
            tiff,
            source: {
                x: 1,
                y: 1,
                imageId: 1,
            },
            x: 0,
            y: 0,
        };
    }

    o.beforeEach(() => {
        fakeCanvasCtx.draws = [];
    });

    o('should resize down', async () => {
        const tiff = fakeCog();
        const comp = makeComp(tiff);
        comp.resize = { width: 10, height: 13 };
        await drawTile(fakeCanvasCtx as any, fakeCanvas, 'FakeImage' as any, tiff, comp);
        o(fakeCanvasCtx.draws.length).equals(1);
        o(fakeCanvasCtx.draws[0]).deepEquals(['FakeImage', 0, 0, 256, 256, 0, 0, 10, 13]);
    });

    o('should crop and resize', async () => {
        const tiff = fakeCog();
        const comp = makeComp(tiff);
        comp.resize = { width: 77, height: 105 };
        comp.crop = new Bounds(0, 0, 77, 51);
        await drawTile(fakeCanvasCtx as any, fakeCanvas, 'FakeImage' as any, tiff, comp);
        o(fakeCanvasCtx.clears.length).equals(1);
        o(fakeCanvasCtx.draws.length).equals(2);
        o(fakeCanvasCtx.draws[0]).deepEquals(['FakeImage', 0, 0, 256, 256, 0, 0, 77, 105]);
        o(fakeCanvasCtx.draws[1]).deepEquals(['FakeCanvas', 0, 0, 77, 51, 0, 0, 77, 51]);
    });
});
