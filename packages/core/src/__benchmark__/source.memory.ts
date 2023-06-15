import { Source } from '../source.js';

export class SourceMemory implements Source {
  data: ArrayBuffer;

  static toArrayBuffer(buf: Buffer | Uint8Array | ArrayBuffer): ArrayBuffer {
    if (buf instanceof ArrayBuffer) return buf;
    if (buf.byteLength === buf.buffer.byteLength) return buf.buffer;
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }

  constructor(bytes: Buffer | Uint8Array | ArrayBuffer) {
    this.data = SourceMemory.toArrayBuffer(bytes);
  }

  async fetchBytes(offset: number, length?: number): Promise<ArrayBuffer> {
    if (offset < 0) offset = this.data.byteLength + offset;
    return this.data.slice(offset, length == null ? undefined : offset + length);
  }
}
