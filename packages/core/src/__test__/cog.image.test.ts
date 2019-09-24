import * as o from 'ospec';
import * as path from 'path';
import 'source-map-support/register';

import { TestFileCogSource } from './fake.source';
import { CogTiff } from '../cog.tiff';

// 900913 properties.
const A = 6378137.0;
const InitialResolution = (2 * Math.PI * A) / 256;

function getResolution(zoom: number): number {
    return InitialResolution / 2 ** zoom;
}

o.spec('CogTiled', () => {
    const cogSourceFile = new TestFileCogSource(path.join(__dirname, '../../data/rgba8_tiled.tiff'));
    const cog = new CogTiff(cogSourceFile);

    o.before(() => cog.init());

    o('should match resolutions to web mercator zoom levels', () => {
        for (let i = 0; i < 14; i++) {
            o(cog.getImageByResolution(getResolution(i)).id).equals(4);
        }

        o(cog.getImageByResolution(getResolution(14)).id).equals(3);
        o(cog.getImageByResolution(getResolution(15)).id).equals(2);
        o(cog.getImageByResolution(getResolution(16)).id).equals(1);
        o(cog.getImageByResolution(getResolution(17)).id).equals(0);
        o(cog.getImageByResolution(getResolution(18)).id).equals(0);

        for (let i = 19; i < 32; i++) {
            o(cog.getImageByResolution(getResolution(i)).id).equals(0);
        }
    });

    o('should get origin from all images', () => {
        const baseOrigin = cog.images[0].origin;
        for (const img of cog.images) {
            o(img.origin).deepEquals(baseOrigin);
        }
    });

    o('should get bounding box from all images', () => {
        const baseOrigin = cog.images[0].bbox;
        for (const img of cog.images) {
            o(img.bbox).deepEquals(baseOrigin);
        }
    });

    o('should scale image resolution for all images', () => {
        const [resX, resY, resZ] = cog.images[0].resolution;
        for (let i = 0; i < cog.images.length; i++) {
            const img = cog.images[i];
            const scale = 2 ** i; // This tiff is scaled at a factor of two per zoom level
            o(img.resolution).deepEquals([resX * scale, resY * scale, resZ]);
        }
    });
});
