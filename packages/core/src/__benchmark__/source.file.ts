import { readFile, stat } from 'fs/promises';
import { Source } from '../source.js';

export class TestFileSource implements Source {
  url: URL;
  data: Promise<Buffer>;

  constructor(fileName: URL) {
    this.url = fileName;
    this.data = readFile(this.url);
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
