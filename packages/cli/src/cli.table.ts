interface CliTableInfo<T> {
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
    const rows = data.map((d, index) => {
      const row = fields.map((f) => {
        const str = f.get(d, index);
        return (str ?? '').padEnd(f.width);
      });
      return rowPadding + row.join('\t');
    });

    rows.unshift(rowPadding + fields.map((f) => f.name.padEnd(f.width)).join('\t'));
    return rows;
  }
}
