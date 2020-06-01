/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as o from 'ospec';
import 'source-map-support/register';
import { CogSourceFile } from '../cog.source.file';
import { join } from 'path';
import { CogTiff } from '@cogeotiff/core';

const TestDataPath = join(__dirname, '..', '..', '..', 'core', 'data');
o.spec('CogSourceFile', () => {
    const TestFile = join(TestDataPath, 'rgba8_tiled.tiff');
    let source: CogSourceFile;
    o.beforeEach(() => {
        source = new CogSourceFile(TestFile);
    });
    o.afterEach(async () => source.close());

    o('should read a file', async () => {
        const tiff = new CogTiff(source);
        await tiff.init();
        o(tiff.images.length).equals(5);
        o(source.fd).notEquals(null);
        await source.close();
    });
    o('should close after reads', async () => {
        source.closeAfterRead = true;
        o(source.fd).equals(null);

        const bytes = await source.fetchBytes(0, 1);
        o(bytes.byteLength).equals(1);
        o(source.fd).equals(null);

        const bytesB = await source.fetchBytes(10, 1);
        o(bytesB.byteLength).equals(1);
        o(source.fd).equals(null);
    });
});
