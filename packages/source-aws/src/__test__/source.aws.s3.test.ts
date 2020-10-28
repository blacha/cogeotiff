/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as o from 'ospec';
import 'source-map-support/register';
import { CogSourceAwsS3, S3Like, S3LikeResponse } from '../cog.source.aws.s3';
import { join } from 'path';
import * as fs from 'fs';

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
    o('should round trip uri', () => {
        o(CogSourceAwsS3.createFromUri('s3://foo/bar.tiff')!.name).equals('s3://foo/bar.tiff');
        o(CogSourceAwsS3.createFromUri('s3://foo/bar/baz.tiff')!.name).equals('s3://foo/bar/baz.tiff');

        // No Key
        o(CogSourceAwsS3.createFromUri('s3://foo')).equals(null);

        // No Bucket
        o(CogSourceAwsS3.createFromUri('s3:///foo')).equals(null);

        // Not s3
        o(CogSourceAwsS3.createFromUri('http://example.com/foo.tiff')).equals(null);
    });

    const TestFile = join(TestDataPath, 'rgba8_tiled.tiff');
    o('should create with defaults', async () => {
        const fileData = await fs.promises.readFile(TestFile);
        const remote = new FakeRemote(fileData);
        CogSourceAwsS3.DefaultS3 = remote;

        await CogSourceAwsS3.create('s3://foo/bar');
        o(remote.requests[0]).deepEquals({ Bucket: 'foo', Key: 'bar', Range: 'bytes=0-65536' });

        await CogSourceAwsS3.create('foo', 'bar');
        o(remote.requests[1]).deepEquals({ Bucket: 'foo', Key: 'bar', Range: 'bytes=0-65536' });
    });

    o('should create with passed in remote', async () => {
        const fileData = await fs.promises.readFile(TestFile);

        const remoteDefault = new FakeRemote(fileData);
        CogSourceAwsS3.DefaultS3 = remoteDefault;

        const freshRemote = new FakeRemote(fileData);
        await CogSourceAwsS3.create('s3://foo/bar', freshRemote);
        o(freshRemote.requests[0]).deepEquals({ Bucket: 'foo', Key: 'bar', Range: 'bytes=0-65536' });

        const freshRemoteB = new FakeRemote(fileData);

        await CogSourceAwsS3.create('foo', 'bar', freshRemoteB);
        o(freshRemoteB.requests[0]).deepEquals({ Bucket: 'foo', Key: 'bar', Range: 'bytes=0-65536' });

        o(remoteDefault.requests.length).equals(0);
        o(freshRemoteB.requests.length).equals(1);
        o(freshRemote.requests.length).equals(1);
    });
});
