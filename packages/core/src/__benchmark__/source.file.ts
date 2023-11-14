import { readFile, stat } from 'node:fs/promises';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';

import { Source } from '../source.js';

const gunzipP = promisify(gunzip);

export class TestFileSource implements Source {
  url: URL;
  data: Promise<Buffer>;

  constructor(fileName: URL) {
    this.url = fileName;
    this.data = readFile(this.url).then((buf) => {
      if (this.url.pathname.endsWith('gz')) return gunzipP(buf);
      return buf;
    });
  }

  async fetch(offset: number, length: number): Promise<ArrayBuffer> {
    const fileData = await this.data;
    return fileData.buffer.slice(fileData.byteOffset + offset, fileData.byteOffset + offset + length);
  }

  get size(): Promise<number> {
    return Promise.resolve()
      .then(() => stat(this.url))
      .then((f) => f.size);
  }
}
