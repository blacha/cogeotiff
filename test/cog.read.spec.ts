import 'source-map-support/register';

import { LogLevel } from 'bblog';
import * as o from 'ospec';
import { CogSourceFile, CogTif } from '../src';
import { TiffVersion } from '../src/read/tif';
import { LoggerConfig } from '../src/util/util.log';
import * as path from 'path';
import { CogTifImageTiled } from '../src/cog.tif.image.tiled';

LoggerConfig.level = 99 as LogLevel;

o.spec('CogRead', () => {
    // TODO this does not load 100% yet
    // o('should read big endian', async () => {
    //     const source = new CogSourceFile(path.join(__dirname, '../..' + '/test/data/be_cog.tif'))
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

    function validate(tif: CogTif) {
        o(tif.images.length).equals(5);

        const [firstTif] = tif.images as CogTifImageTiled[];
        o(firstTif.isTiled()).equals(true);
        o(firstTif.tileInfo).deepEquals({ width: 256, height: 256 });
        o(firstTif.size).deepEquals({ width: 64, height: 64 });
    }

    o('should read big tiff', async () => {
        const source = new CogSourceFile(path.join(__dirname, '../..' + '/test/data/big_cog.tif'));
        const tif = new CogTif(source);

        await tif.init();

        o(source.isLittleEndian).equals(true);
        o(source.version).equals(TiffVersion.BigTiff);
        validate(tif);
    });

    o('should read tiff', async () => {
        const source = new CogSourceFile(path.join(__dirname, '../..' + '/test/data/cog.tif'));
        const tif = new CogTif(source);

        await tif.init();

        o(source.isLittleEndian).equals(true);
        o(source.version).equals(TiffVersion.Tiff);
        validate(tif);

        const [firstTif] = tif.images;
        o(firstTif.compression).equals('image/jpeg');
    });
});
