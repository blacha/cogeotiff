import assert from 'node:assert';
import { describe, it } from 'node:test';
import { CogTiff } from '../cog.tiff.js';
import { TiffMimeType } from '../const/tiff.mime.js';
import { TiffVersion } from '../const/tiff.version.js';
import { CogSource } from '../source.js';
import { promises as fs } from 'fs';

export class TestFileSource implements CogSource {
    url: URL;

    constructor(fileName: URL) {
        this.url = fileName;
    }
    async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
        const fileData = await fs.readFile(this.url);
        return fileData.buffer.slice(fileData.byteOffset + offset, fileData.byteOffset + offset + length);
    }

    get size(): Promise<number> {
        return Promise.resolve()
            .then(() => fs.stat(this.url))
            .then((f) => f.size);
    }
}
function validate(tif: CogTiff): void {
    assert.equal(tif.images.length, 5);

    const [firstTif] = tif.images;
    assert.equal(firstTif.isTiled(), true);
    assert.deepEqual(firstTif.tileSize, { width: 256, height: 256 });
    assert.deepEqual(firstTif.size, { width: 64, height: 64 });
}

describe('CogRead', () => {
    // TODO this does not load 100% yet
    // it('should read big endian', async () => {
    //     const source = new TestFileSource(new URL('../../data/big_cog.tiff', import.meta.url));
    //     const tiff = new CogTiff(source);

    //     await tiff.init();

    //     assert.equal(tiff.isLittleEndian, false);
    //     assert.equal(tiff.version, TiffVersion.BigTiff);
    //     validate(tiff);
    // });

    it('should read big tiff', async () => {
        const source = new TestFileSource(new URL('../../data/big_cog.tiff', import.meta.url));
        const tiff = new CogTiff(source);

        await tiff.init();

        assert.equal(tiff.isLittleEndian, true);
        assert.equal(tiff.version, TiffVersion.BigTiff);
        validate(tiff);
    });

    it('should read tiff', async () => {
        const source = new TestFileSource(new URL('../../data/cog.tiff', import.meta.url));
        const tiff = new CogTiff(source);

        await tiff.init();

        assert.equal(tiff.isLittleEndian, true);
        assert.equal(tiff.version, TiffVersion.Tiff);
        validate(tiff);

        const [firstTif] = tiff.images;
        assert.equal(firstTif.compression, TiffMimeType.Jpeg);
    });

    it('should allow multiple init', async () => {
        const source = new TestFileSource(new URL('../../data/cog.tiff', import.meta.url));
        const tiff = new CogTiff(source);

        assert.equal(tiff.isInitialized, false);
        await tiff.init();
        assert.equal(tiff.isInitialized, true);
        assert.equal(tiff.images.length, 5);

        assert.equal(tiff.isInitialized, true);
        await tiff.init();
        assert.equal(tiff.images.length, 5);
    });
});
