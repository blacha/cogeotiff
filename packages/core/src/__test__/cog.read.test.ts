import * as o from 'ospec';
import * as path from 'path';
import 'source-map-support/register';

import { CogTiff } from '../cog.tiff';
import { TiffVersion } from '../const/tiff.version';
import { TestFileCogSource } from './fake.source';
import { TiffMimeType } from '../const';

o.spec('CogRead', () => {
    // TODO this does not load 100% yet
    // o('should read big endian', async () => {
    //     const source = new TestFileCogSource(path.join(__dirname, '../..' + '/test/data/be_cog.tif'))
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
        const source = new TestFileCogSource(path.join(__dirname, '../..' + '/data/big_cog.tif'));
        const tif = new CogTiff(source);

        await tif.init();

        o(source.isLittleEndian).equals(true);
        o(source.version).equals(TiffVersion.BigTiff);
        validate(tif);
    });

    o('should read tiff', async () => {
        const source = new TestFileCogSource(path.join(__dirname, '../..' + '/data/cog.tif'));
        const tif = new CogTiff(source);

        await tif.init();

        o(source.isLittleEndian).equals(true);
        o(source.version).equals(TiffVersion.Tiff);
        validate(tif);

        const [firstTif] = tif.images;
        o(firstTif.compression).equals(TiffMimeType.JPEG);
    });

    o('should allow multiple init', async () => {
        const source = new TestFileCogSource(path.join(__dirname, '../..' + '/data/cog.tif'));
        const tif = new CogTiff(source);

        o(tif.isInitialized).equals(false);
        await tif.init();
        o(tif.isInitialized).equals(true);
        o(tif.images.length).equals(5);

        o(tif.isInitialized).equals(true);
        await tif.init();
        o(tif.images.length).equals(5);
    });
});
