import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import 'source-map-support/register.js';

import { CogTiff } from '../cog.tiff.js';
import { TiffVersion } from '../const/tiff.version.js';
import { TiffMimeType } from '../const/tiff.mime.js';
import { TestFileChunkSource } from '@chunkd/core/build/__test__/chunk.source.fake.js';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(import.meta.url);

describe('CogRead', () => {
    // TODO this does not load 100% yet
    // o('should read big endian', async () => {
    //     const source = new TestFileChunkSource(path.join(__dirname, '../../../test/data/be_cog.tif'))
    //     const tif = new CogTif(source);

    //     await tif.init();

    //     o(source.isLittleEndian).equals(false);
    //     o(source.version).equals(TiffVersion.Tiff);
    //     o(tif.images.length).equals(5)
    //     const [firstTif] = tif.images;
    //     o(firstTif.isTiled()).equals(true);
    //
    //     // o(firstTif.compression).equals('image/jpeg')
    // })

    function validate(tif: CogTiff): void {
        assert.equal(tif.images.length, 5);

        const [firstTif] = tif.images;
        assert.equal(firstTif.isTiled(), true);
        assert.deepEqual(firstTif.tileSize, { width: 256, height: 256 });
        assert.deepEqual(firstTif.size, { width: 64, height: 64 });
    }

    it('should read big tiff', async () => {
        const source = new TestFileChunkSource(path.join(__dirname, '../../../data/big_cog.tif'));
        const tiff = new CogTiff(source);

        await tiff.init();

        assert.equal(source.isLittleEndian, true);
        assert.equal(tiff.version, TiffVersion.BigTiff);
        validate(tiff);
    });

    it('should read tiff', async () => {
        const source = new TestFileChunkSource(path.join(__dirname, '../../../data/cog.tif'));
        const tiff = new CogTiff(source);

        await tiff.init();

        assert.equal(source.isLittleEndian, true);
        assert.equal(tiff.version, TiffVersion.Tiff);
        validate(tiff);

        const [firstTif] = tiff.images;
        assert.equal(firstTif.compression, TiffMimeType.JPEG);
    });

    it('should allow multiple init', async () => {
        const source = new TestFileChunkSource(path.join(__dirname, '../../../data/cog.tif'));
        const tiff = new CogTiff(source);

        assert.equal(tiff.isInitialized, false);
        await tiff.init();
        assert.equal(tiff.isInitialized, true);
        assert.equal(tiff.images.length, 5);

        assert.equal(tiff.isInitialized, true);
        await tiff.init();
        assert.equal(tiff.images.length, 5);
    });

    it('should close a source', async () => {
        const source = new TestFileChunkSource(path.join(__dirname, '../../../data/cog.tif'));
        const tiff = new CogTiff(source);
        // Should not close if there is no close
        source.close = undefined;
        await tiff.close();

        let callCount = 0;
        const closeSpy = (): Promise<void> => {
            callCount++;
            return Promise.resolve();
        };
        source.close = closeSpy;
        await tiff.close();
        assert.equal(callCount, 1);
    });
});
