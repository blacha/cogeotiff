/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as o from 'ospec';
import 'source-map-support/register';
import { CogSourceAwsS3 } from '../cog.source.aws.s3';

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
});
