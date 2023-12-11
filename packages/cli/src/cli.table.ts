import c from 'ansi-colors';

export interface CliTableInfo<T> {
  /** Header for the table */
  name: string;
  /** Pad the field out to this width */
  width: number;
  /** Get the field value */
  get: (obj: T, index?: number) => string | null;
  /**
   * Is this field enabled,
   * Fields are only enabled if every data record returns true for enabled
   */
  enabled?: (obj: T) => boolean;
}

export class CliTable<T> {
  fields: CliTableInfo<T>[] = [];
  add(fields: CliTableInfo<T>): void {
    this.fields.push(fields);
  }

  print(data: T[], rowPadding = ''): string[] {
    const fields = this.fields.filter((f) => data.every((d) => f.enabled?.(d) ?? true));
    const values = fields.map((f) => data.map((d, i) => f.get(d, i)));
    const sizes = values.map((val) => val.reduce((v, c) => Math.max(v, c?.length ?? 0), 0));

    const rows: string[] = [rowPadding + fields.map((f, i) => c.bold(f.name.padEnd(sizes[i] + 2))).join('\t')];
    for (let i = 0; i < data.length; i++) {
      const row: string[] = [];
      for (let f = 0; f < fields.length; f++) {
        const fValue = values[f][i];
        const fSize = sizes[f];
        row.push((fValue ?? '').padEnd(fSize + 2));
      }
      rows.push(rowPadding + row.join('\t'));
    }

    return rows;
  }
}
