/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as o from 'ospec';
import 'source-map-support/register';
import { CogSourceAwsS3, S3Like, S3LikeResponse } from '../cog.source.aws.s3';
import { join } from 'path';
import * as fs from 'fs';
import { CogTiff } from '@cogeotiff/core';

const TestDataPath = join(__dirname, '..', '..', '..', 'core', 'data');

export class FakeRemote implements S3Like {
    static id = 0;
    id = FakeRemote.id++;
    requests: { Bucket: string; Key: string; Range: string }[] = [];
    data: Buffer;
    constructor(data: Buffer) {
        this.data = data;
    }
    getObject(ctx: { Bucket: string; Key: string; Range: string }): S3LikeResponse {
        this.requests.push(ctx);
        return { promise: () => Promise.resolve({ Body: this.data.slice() }) };
    }
}

o.spec('CogSourceAwsS3', () => {
    const fakeRemote = new FakeRemote(Buffer.from([]));

    o('should round trip uri', () => {
        o(CogSourceAwsS3.fromUri('s3://foo/bar.tiff', fakeRemote)!.name).equals('s3://foo/bar.tiff');
        o(CogSourceAwsS3.fromUri('s3://foo/bar/baz.tiff', fakeRemote)!.name).equals('s3://foo/bar/baz.tiff');

        // No Key
        o(CogSourceAwsS3.fromUri('s3://foo', fakeRemote)).equals(null);

        // No Bucket
        o(CogSourceAwsS3.fromUri('s3:///foo', fakeRemote)).equals(null);

        // Not s3
        o(CogSourceAwsS3.fromUri('http://example.com/foo.tiff', fakeRemote)).equals(null);
    });

    const TestFile = join(TestDataPath, 'rgba8_tiled.tiff');
    o('should create with defaults', async () => {
        const fileData = await fs.promises.readFile(TestFile);
        const remote = new FakeRemote(fileData);

        await new CogTiff(CogSourceAwsS3.fromUri('s3://foo/bar', remote)!).init();
        o(remote.requests[0]).deepEquals({ Bucket: 'foo', Key: 'bar', Range: 'bytes=0-65536' });

        await new CogTiff(new CogSourceAwsS3('foo', 'bar', remote)).init();
        o(remote.requests[1]).deepEquals({ Bucket: 'foo', Key: 'bar', Range: 'bytes=0-65536' });
    });
});
