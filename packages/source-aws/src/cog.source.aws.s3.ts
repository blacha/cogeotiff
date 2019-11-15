import { CogLogger, CogSource, CogSourceChunked, CogTiff } from '@cogeotiff/core';
import * as S3 from 'aws-sdk/clients/s3';

export class CogSourceAwsS3 extends CogSourceChunked {
    type = 'aws-s3';

    // HTTP gets are slow, get a larger amount
    chunkSize: number = 64 * 1024;
    maxChunkCount: number = 32;

    delayMs = 5;

    bucket: string;
    key: string;
    s3: S3;

    constructor(bucket: string, key: string) {
        super();
        this.bucket = bucket;
        this.key = key;
        this.s3 = new S3();
    }

    get name() {
        return `s3://${this.bucket}/${this.key}`;
    }

    static isSource(source: CogSource): source is CogSourceAwsS3 {
        return source.type === 'aws-s3';
    }

    /**
     * Load a COG from a AWS S3 Bucket
     *
     * @param bucket AWS S3 Bucket name
     * @param key Path to COG inside of bucket
     */
    static async create(bucket: string, key: string): Promise<CogTiff> {
        return new CogTiff(new CogSourceAwsS3(bucket, key)).init();
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

        const response = await this.s3
            .getObject({
                Bucket: this.bucket,
                Key: this.key,
                Range: fetchRange,
            })
            .promise();

        return (response.Body as Buffer).buffer;
    }
}
