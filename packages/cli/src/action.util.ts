import { ChunkSource } from '@chunkd/core';
import { fsa } from '@chunkd/fs';
import { CogTiff } from '@cogeotiff/core';
import c from 'ansi-colors';

export interface CLiResultMapLine {
  key: string;
  value: string | number | boolean | number[] | null;
  enabled?: boolean;
}
export interface CliResultMap {
  title?: string;
  keys: (CLiResultMapLine | null)[];
  enabled?: boolean;
}

export const ActionUtil = {
  async getCogSource(file?: URL): Promise<{ source: ChunkSource; tif: CogTiff }> {
    if (file == null) {
      throw new Error(`File "${file} is not valid`);
    }
    const source = fsa.source(file.href);
    if (source == null) throw new Error(`File "${file} is not valid`);
    (source as any).url = source.uri;
    (source as any).fetch = source.fetchBytes;
    const tif = new CogTiff(source as any);
    await tif.init();
    return { source, tif };
  },
  formatResult(title: string, result: CliResultMap[]): string[] {
    const msg: string[] = [title];
    for (const group of result) {
      if (group.enabled === false) continue;
      msg.push('');
      if (group.title) msg.push(c.bold(group.title));
      for (const kv of group.keys) {
        if (kv == null) continue;
        if (kv.enabled === false) continue;
        if (kv.value == null || (typeof kv.value === 'string' && kv.value.trim() === '')) {
          continue;
        }
        msg.push(`    ${kv.key.padEnd(14, ' ')}  ${String(kv.value)}`);
      }
    }
    return msg;
  },
};
