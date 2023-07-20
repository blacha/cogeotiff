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
