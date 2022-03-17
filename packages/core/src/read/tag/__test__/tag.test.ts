import { TestFileChunkSource } from '@chunkd/core/build/__test__/chunk.source.fake.js';
import o from 'ospec';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CogTiff } from '../../../cog.tiff.js';
import { CogTiffTagLazy } from '../tiff.tag.lazy.js';

o.spec('TiffTag', () => {
    const dirName = fileURLToPath(import.meta.url);
    const cogSourceFile = new TestFileChunkSource(path.join(dirName, '../../../../../data/rgba8_tiled.tiff'));

    o.beforeEach(() => {
        (cogSourceFile.chunks as Map<unknown, unknown>).clear();
    });

    o('should load lazy tags', async () => {
        const tiff = new CogTiff(cogSourceFile);

        await cogSourceFile.loadBytes(3680, 8);
        const lazy = new CogTiffTagLazy(339, tiff, 3680);
        o(lazy.value).equals(null);

        const res = await lazy.fetch();
        o(res).deepEquals([18761, 43, 8, 0]);
        o(lazy.value).deepEquals(res);
    });
});
