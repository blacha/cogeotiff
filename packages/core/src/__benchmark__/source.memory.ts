import type { Source } from '../source.js';

export class SourceMemory implements Source {
  url: URL;
  data: ArrayBuffer;
  metadata: { size: number };

  static toArrayBuffer(buf: Buffer | Uint8Array | ArrayBuffer): ArrayBuffer {
    if (buf instanceof ArrayBuffer) return buf;
    if (buf.byteLength === buf.buffer.byteLength) return buf.buffer as ArrayBuffer;
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }

  constructor(bytes: Buffer | Uint8Array | ArrayBuffer) {
    this.url = new URL('memory://fake-file');
    this.data = SourceMemory.toArrayBuffer(bytes);
    this.metadata = { size: this.data.byteLength };
  }

  async fetch(offset: number, length?: number): Promise<ArrayBuffer> {
    // console.log('Fetch', offset, length);
    if (offset < 0) offset = this.data.byteLength + offset;
    if (offset > this.data.byteLength) {
      throw new Error(`Read offset outside bounds ${offset}-${length}`);
    }

    if (length && offset + length > this.data.byteLength) {
      throw new Error(`Read length outside bounds ${offset}-${length}`);
    }

    return this.data.slice(offset, length == null ? undefined : offset + length);
  }
}
