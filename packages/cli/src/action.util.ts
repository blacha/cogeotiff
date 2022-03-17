import { ChunkSource } from '@chunkd/core';
import { CogTiff } from '@cogeotiff/core';
import { fsa } from '@chunkd/fs';
import { CommandLineStringParameter } from '@rushstack/ts-command-line';
import c from 'ansi-colors';
import { logger as CliLogger } from './cli.log.js';

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
        const source = fsa.source(file.value);
        if (source == null) throw new Error(`File "${file} is not valid`);

        const tif = new CogTiff(source);
        await tif.init(false);
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
