import { CogSource, CogTiff } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import { CogSourceUrl } from '@cogeotiff/source-url';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CommandLineStringParameter } from '@microsoft/ts-command-line';
import * as chalk from 'chalk';

export interface CLiResultMapLine {
    key: string;
    value: string | number | boolean | number[] | null;
}
export interface CliResultMap {
    title?: string;
    keys: (CLiResultMapLine | null)[];
}

export const ActionUtil = {
    async getCogSource(file?: CommandLineStringParameter | null): Promise<{ source: CogSource; tif: CogTiff }> {
        if (file == null || file.value == null) {
            throw new Error(`File "${file} is not valid`);
        }
        let source: CogSource;
        if (file.value.startsWith('http')) {
            source = new CogSourceUrl(file.value);
        } else if (file.value.startsWith('s3://')) {
            const src = CogSourceAwsS3.createFromUri(file.value);
            if (src == null) {
                throw new Error(`Unable to parse s3 uri: ${file.value}`);
            }
            source = src;
        } else {
            source = new CogSourceFile(file.value);
        }

        const tif = new CogTiff(source);
        await tif.init();
        return { source, tif };
    },
    formatResult(title: string, result: CliResultMap[]): string[] {
        const msg: string[] = [title];
        for (const group of result) {
            msg.push('');
            if (group.title) {
                msg.push(chalk`  {bold ${group.title}}`);
            }
            for (const kv of group.keys) {
                if (kv == null) {
                    continue;
                }
                if (kv.value == null || (typeof kv.value === 'string' && kv.value.trim() === '')) {
                    continue;
                }
                msg.push(chalk`    ${kv.key.padEnd(14, ' ')}  ${String(kv.value)}`);
            }
        }
        return msg;
    },
};
