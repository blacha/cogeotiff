import { CogLogger, CogSource, CogSourceChunked, CogTiff } from '@cogeotiff/core';
import * as S3 from 'aws-sdk/clients/s3';

class CompositeError extends Error {
    reason: Error;
    constructor(msg: string, reason: Error) {
        super(msg);
        this.reason = reason;
    }
}

export class CogSourceAwsS3 extends CogSourceChunked {
    type = 'aws-s3';

    // HTTP gets are slow, get a larger amount
    chunkSize: number = 64 * 1024;
    maxChunkCount = 32;

    delayMs = 5;

    bucket: string;
    key: string;
    s3: S3;

    constructor(bucket: string, key: string, s3: S3 = new S3()) {
        super();
        this.bucket = bucket;
        this.key = key;
        this.s3 = s3;
    }

    get uri() {
        return this.name;
    }

    get name() {
        return `s3://${this.bucket}/${this.key}`;
    }

    static isSource(source: CogSource): source is CogSourceAwsS3 {
        return source.type === 'aws-s3';
    }
    /**
     * Parse a s3 URI and return the components
     *
     * @example
     * `s3://foo/bar/baz.tiff`
     *
     * @param uri URI to parse
     */
    static parse(uri: string): { key: string; bucket: string } | null {
        if (!uri.startsWith('s3://')) {
            return null;
        }
        const parts = uri.split('/');
        const bucket = parts[2];
        if (bucket == null || bucket.trim() == '') {
            return null;
        }
        const key = parts.slice(3).join('/');
        if (key == null || key.trim() == '') {
            return null;
        }
        return { key, bucket };
    }

    /**
     * Parse a URI and create a source
     *
     * @example
     * `s3://foo/bar/baz.tiff`
     *
     * @param uri URI to parse
     */
    static createFromUri(uri: string): CogSourceAwsS3 | null {
        const res = CogSourceAwsS3.parse(uri);
        if (res == null) {
            return null;
        }
        return new CogSourceAwsS3(res.bucket, res.key);
    }

    /**
     * Load a COG from a AWS S3 Bucket
     * @param uri URI to load `s3://foo/baz.tiff`
     */
    static async create(uri: string): Promise<CogTiff>;
    /**
     * Load a COG from a AWS S3 Bucket
     *
     * @param bucket AWS S3 Bucket name
     * @param key Path to COG inside of bucket
     */
    static async create(bucket: string, key: string): Promise<CogTiff>;
    static async create(sA: string, key?: string): Promise<CogTiff> {
        if (key == null) {
            const source = CogSourceAwsS3.createFromUri(sA);
            if (source == null) {
                throw new Error(`Invalid URI ${sA}`);
            }
            return new CogTiff(source).init();
        }
        return new CogTiff(new CogSourceAwsS3(sA, key)).init();
    }

    protected async loadChunks(firstChunk: number, lastChunk: number, logger: CogLogger | null): Promise<ArrayBuffer> {
        const fetchRange = `bytes=${firstChunk * this.chunkSize}-${lastChunk * this.chunkSize + this.chunkSize}`;
        const chunkCount = lastChunk - firstChunk || 1;

        logger?.info(
            {
                firstChunk,
                lastChunk,
                chunkCount,
                bytes: chunkCount * this.chunkSize,
                fetchRange,
            },
            'S3Get',
        );

        try {
            const res = await this.s3
                .getObject({
                    Bucket: this.bucket,
                    Key: this.key,
                    Range: fetchRange,
                })
                .promise();
            return (res.Body as Buffer).buffer;
        } catch (error) {
            logger?.error({ error, source: this.name, firstChunk, lastChunk, fetchRange }, 'FailedToFetch');
            throw new CompositeError(`Failed to fetch ${this.name} ${fetchRange}`, error);
        }
    }
}
