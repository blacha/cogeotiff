import * as o from 'ospec';
import * as path from 'path';
import 'source-map-support/register';

import { CogTiff } from '../cog.tiff';
import { TiffVersion } from '../const/tiff.version';
import { TiffMimeType } from '../const';
import { TestFileChunkSource } from '@cogeotiff/chunk/build/__test__/chunk.source.fake';

o.spec('CogRead', () => {
    // TODO this does not load 100% yet
    // o('should read big endian', async () => {
    //     const source = new TestFileChunkSource(path.join(__dirname, '../..' + '/test/data/be_cog.tif'))
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

    function validate(tif: CogTiff) {
        o(tif.images.length).equals(5);

        const [firstTif] = tif.images;
        o(firstTif.isTiled()).equals(true);
        o(firstTif.tileSize).deepEquals({ width: 256, height: 256 });
        o(firstTif.size).deepEquals({ width: 64, height: 64 });
    }

    o('should read big tiff', async () => {
        const source = new TestFileChunkSource(path.join(__dirname, '../..' + '/data/big_cog.tif'));
        const tiff = new CogTiff(source);

        await tiff.init(true, console as any);

        o(source.isLittleEndian).equals(true);
        o(tiff.version).equals(TiffVersion.BigTiff);
        validate(tiff);
    });

    o('should read tiff', async () => {
        const source = new TestFileChunkSource(path.join(__dirname, '../..' + '/data/cog.tif'));
        const tiff = new CogTiff(source);

        await tiff.init();

        o(source.isLittleEndian).equals(true);
        o(tiff.version).equals(TiffVersion.Tiff);
        validate(tiff);

        const [firstTif] = tiff.images;
        o(firstTif.compression).equals(TiffMimeType.JPEG);
    });

    o('should allow multiple init', async () => {
        const source = new TestFileChunkSource(path.join(__dirname, '../..' + '/data/cog.tif'));
        const tiff = new CogTiff(source);

        o(tiff.isInitialized).equals(false);
        await tiff.init();
        o(tiff.isInitialized).equals(true);
        o(tiff.images.length).equals(5);

        o(tiff.isInitialized).equals(true);
        await tiff.init();
        o(tiff.images.length).equals(5);
    });

    o('should close a source', async () => {
        const source = new TestFileChunkSource(path.join(__dirname, '../..' + '/data/cog.tif'));
        const tiff = new CogTiff(source);
        // Should not close if there is no close
        source.close = undefined;
        await tiff.close();

        const closeSpy = o.spy(() => Promise.resolve());
        source.close = closeSpy;
        await tiff.close();
        o(closeSpy.callCount).equals(1);
    });
});
