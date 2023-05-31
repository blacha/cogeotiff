import { TestFileChunkSource } from '@chunkd/core/build/__test__/chunk.source.fake.js';
import { describe, beforeEach, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CogTiff } from '../../../cog.tiff.js';
import { CogTiffTagLazy } from '../tiff.tag.lazy.js';

describe('TiffTag', () => {
    const dirName = fileURLToPath(import.meta.url);
    const cogSourceFile = new TestFileChunkSource(path.join(dirName, '../../../../../data/rgba8_tiled.tiff'));

    beforeEach(() => {
        (cogSourceFile.chunks as Map<unknown, unknown>).clear();
    });

    it('should load lazy tags', async () => {
        const tiff = new CogTiff(cogSourceFile);

        await cogSourceFile.loadBytes(3680, 8);
        const lazy = new CogTiffTagLazy(339, tiff, 3680);
        assert.equal(lazy.value, null);

        const res = await lazy.fetch();
        assert.deepEqual(res, [18761, 43, 8, 0]);
        assert.deepEqual(lazy.value, res);
    });
});
