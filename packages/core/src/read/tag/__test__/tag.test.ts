import { TestFileChunkSource } from '@chunkd/core/build/__test__/chunk.source.fake';
import * as o from 'ospec';
import { CogTiff } from '../../../cog.tiff';
import * as path from 'path';
import { CogTiffTagLazy } from '../tiff.tag.lazy';

o.spec('TiffTag', () => {
    const cogSourceFile = new TestFileChunkSource(path.join(__dirname, '../../../../data/rgba8_tiled.tiff'));

    o.beforeEach(() => {
        cogSourceFile.chunks.clear();
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
