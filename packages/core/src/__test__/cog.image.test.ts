import o from 'ospec';
import * as path from 'path';
import { promises as fs } from 'fs';

import 'source-map-support/register.js';

import { TestFileChunkSource } from '@chunkd/core/build/__test__/chunk.source.fake.js';
import { CogTiff } from '../cog.tiff.js';
import { TiffMimeType } from '../const/index.js';
import { ByteSize, SourceMemory } from '@chunkd/core';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(import.meta.url);
// 900913 properties.
const A = 6378137.0;
const InitialResolution = (2 * Math.PI * A) / 256;

function getResolution(zoom: number): number {
    return InitialResolution / 2 ** zoom;
}

o.spec('CogTiled', () => {
    const cogSourceFile = new TestFileChunkSource(path.join(__dirname, '../../../data/rgba8_tiled.tiff'));
    const cog = new CogTiff(cogSourceFile);

    o.beforeEach(() => cog.init());

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

    o('should be geolocated', () => {
        for (const img of cog.images) o(img.isGeoLocated).equals(true);
    });

    o('should scale image resolution for all images', () => {
        const [resX, resY, resZ] = cog.images[0].resolution;
        for (let i = 0; i < cog.images.length; i++) {
            const img = cog.images[i];
            const scale = 2 ** i; // This tiff is scaled at a factor of two per zoom level
            o(img.resolution).deepEquals([resX * scale, resY * scale, resZ]);
        }
    });

    o('should have tile information', () => {
        const [firstImage] = cog.images;
        o(firstImage.stripCount).equals(0);
        o(firstImage.isTiled()).equals(true);
    });

    o('should hasTile for every tile', async () => {
        const [firstImage] = cog.images;

        for (let x = 0; x < firstImage.tileCount.x; x++) {
            for (let y = 0; y < firstImage.tileCount.y; y++) {
                o(await firstImage.hasTile(x, y)).equals(true);
            }
        }
    });
});

o.spec('Cog.Big', () => {
    o('should support reading from memory', async () => {
        const fullSource = new TestFileChunkSource(path.join(__dirname, '../../../data/sparse.tiff'));
        fullSource.chunkSize = 27902;
        await fullSource.loadBytes(0, 27902);
        const cog = new CogTiff(fullSource);
        await cog.init();

        o(fullSource.chunkSize).equals(27902);
        o(fullSource.chunks.size).equals(1);
        const [firstImage] = cog.images;
        o(firstImage.stripCount).equals(0);
        o(firstImage.isTiled()).equals(true);

        const img = cog.getImage(4);
        o(img.tileCount).deepEquals({ x: 2, y: 2 });
    });

    o('should read using a memory source', async () => {
        const bytes = await fs.readFile(path.join(__dirname, '../../../data/sparse.tiff'));
        const source = new SourceMemory('Sparse.tiff', bytes.buffer);
        const cog = new CogTiff(source);
        await cog.init();

        o(source.chunkSize).equals(27902);
        o(source.chunks.size).equals(1);
        const [firstImage] = cog.images;
        o(firstImage.stripCount).equals(0);
        o(firstImage.isTiled()).equals(true);

        const img = cog.getImage(4);
        o(img.tileCount).deepEquals({ x: 2, y: 2 });
    });
});

o.spec('Cog.Sparse', () => {
    const cogSourceFile = new TestFileChunkSource(path.join(__dirname, '../../../data/sparse.tiff'));
    const cog = new CogTiff(cogSourceFile);
    o.beforeEach(() => cog.init(true));

    o('should read metadata', () => {
        o(cog.getImage(0).epsg).equals(2193);
    });

    o('should be geolocated', () => {
        for (const img of cog.images) o(img.isGeoLocated).equals(true);
    });

    o('should support sparse cogs', async () => {
        const z = 4;
        const img = cog.getImage(z);

        const { tileCount } = img;
        o(tileCount).deepEquals({ x: 2, y: 2 });

        for (let x = 0; x < tileCount.x; x++) {
            for (let y = 0; y < tileCount.y; y++) {
                const hasTile = await img.hasTile(x, y);
                o(hasTile).equals(false);
                const tileXy = await img.getTile(x, y);
                const tileXyz = await cog.getTile(x, y, z);
                o(tileXy).equals(null)(`Tile x:${x} y:${y} should be empty`);
                o(tileXyz).equals(null)(`Tile x:${x} y:${y} z: ${z} should be empty`);
            }
        }
    });

    o('should have ghost options', () => {
        o(cog.options.options.size).equals(6);
        o(cog.options.tileLeaderByteSize).equals(ByteSize.UInt32);
        o(cog.options.isCogOptimized).equals(true);

        const entries = [...cog.options.options.entries()];
        o(entries).deepEquals([
            ['GDAL_STRUCTURAL_METADATA_SIZE', '000140 bytes'],
            ['LAYOUT', 'IFDS_BEFORE_DATA'],
            ['BLOCK_ORDER', 'ROW_MAJOR'],
            ['BLOCK_LEADER', 'SIZE_AS_UINT4'],
            ['BLOCK_TRAILER', 'LAST_4_BYTES_REPEATED'],
            ['KNOWN_INCOMPATIBLE_EDITION', 'NO'],
        ]);
    });
});

o.spec('CogStrip', () => {
    const cogSourceFile = new TestFileChunkSource(path.join(__dirname, '../../../data/rgba8_strip.tiff'));
    const cog = new CogTiff(cogSourceFile);

    o.beforeEach(() => cog.init());

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

    o('should have strip information', async () => {
        const [firstImage] = cog.images;
        o(firstImage.isTiled()).equals(false);
        o(firstImage.stripCount).equals(2);

        const stripA = await firstImage.getStrip(0);
        o(stripA?.mimeType).equals(TiffMimeType.WEBP);
        o(stripA?.bytes.byteLength).equals(152);

        const stripB = await firstImage.getStrip(1);
        o(stripB?.mimeType).equals(TiffMimeType.WEBP);
        o(stripB?.bytes.byteLength).equals(152);
    });
});
