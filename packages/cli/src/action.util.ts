import { ChunkSource } from '@cogeotiff/chunk';
import { CogTiff } from '@cogeotiff/core';
import { SourceAwsS3 } from '@cogeotiff/source-aws';
import { SourceFile } from '@cogeotiff/source-file';
import { SourceUrl } from '@cogeotiff/source-url';
import { CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as c from 'ansi-colors';
import * as S3 from 'aws-sdk/clients/s3';
import { CliLogger } from './cli.log';

const DefaultS3 = new S3();

export interface CLiResultMapLine {
    key: string;
    value: string | number | boolean | number[] | null;
}
export interface CliResultMap {
    title?: string;
    keys: (CLiResultMapLine | null)[];
}

export const ActionUtil = {
    async getCogSource(file?: CommandLineStringParameter | null): Promise<{ source: ChunkSource; tif: CogTiff }> {
        if (file == null || file.value == null) {
            throw new Error(`File "${file} is not valid`);
        }
        let source: ChunkSource;
        if (file.value.startsWith('http')) {
            source = new SourceUrl(file.value);
        } else if (file.value.startsWith('s3://')) {
            const src = SourceAwsS3.fromUri(file.value, DefaultS3);
            if (src == null) throw new Error(`Unable to parse s3 uri: ${file.value}`);
            source = src;
        } else {
            source = new SourceFile(file.value);
        }

        const tif = new CogTiff(source);
        await tif.init(false, CliLogger);
        return { source, tif };
    },
    formatResult(title: string, result: CliResultMap[]): string[] {
        const msg: string[] = [title];
        for (const group of result) {
            msg.push('');
            if (group.title) {
                msg.push(c.bold(group.title));
            }
            for (const kv of group.keys) {
                if (kv == null) {
                    continue;
                }
                if (kv.value == null || (typeof kv.value === 'string' && kv.value.trim() === '')) {
                    continue;
                }
                msg.push(`    ${kv.key.padEnd(14, ' ')}  ${String(kv.value)}`);
            }
        }
        return msg;
    },
};
