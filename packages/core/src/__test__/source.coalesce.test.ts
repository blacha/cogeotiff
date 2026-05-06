import assert from 'node:assert';
import { describe, it } from 'node:test';
import { coalesceRanges } from '../source.coalesce.js';
import type { Source } from '../source.js';

/**
 * Test source backed by an in-memory buffer. Records every fetch call so tests
 * can assert call counts and arguments.
 */
class RecordingSource implements Source {
  url = new URL('memory://recording');
  fetches: { offset: number; length: number }[] = [];
  /** Number of fetches in flight at any moment. Updated synchronously around the await. */
  inflight = 0;
  peakInflight = 0;
  /** If set, every fetch awaits this many microtasks before returning, exposing concurrency. */
  delayTicks = 0;

  constructor(private readonly buffer: Uint8Array) {}

  async fetch(offset: number, length: number): Promise<ArrayBuffer> {
    this.fetches.push({ offset, length });
    this.inflight++;
    if (this.inflight > this.peakInflight) this.peakInflight = this.inflight;
    try {
      for (let i = 0; i < this.delayTicks; i++) await Promise.resolve();
      const slice = this.buffer.slice(offset, offset + length);
      return slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer;
    } finally {
      this.inflight--;
    }
  }
}

/** Build a buffer where each byte equals (index % 256). Easy to verify slices. */
function makeBuffer(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  for (let i = 0; i < size; i++) buf[i] = i & 0xff;
  return buf;
}

describe('coalesceRanges', () => {
  it('returns [] and makes no fetches for empty input', async () => {
    const source = new RecordingSource(makeBuffer(64));
    const result = await coalesceRanges(source, []);
    assert.deepEqual(result, []);
    assert.equal(source.fetches.length, 0);
  });

  it('fetches a single range as one source call', async () => {
    const source = new RecordingSource(makeBuffer(64));
    const result = await coalesceRanges(source, [{ offset: 10, length: 5 }]);

    assert.equal(result.length, 1);
    assert.deepEqual(new Uint8Array(result[0]), new Uint8Array([10, 11, 12, 13, 14]));
    assert.equal(source.fetches.length, 1);
    assert.deepEqual(source.fetches[0], { offset: 10, length: 5 });
  });

  it('merges two adjacent ranges within coalesce gap into one fetch', async () => {
    const source = new RecordingSource(makeBuffer(128));
    const result = await coalesceRanges(
      source,
      [
        { offset: 10, length: 4 }, // covers 10..14
        { offset: 20, length: 4 }, // covers 20..24, gap = 6
      ],
      { coalesce: 16 },
    );

    assert.equal(source.fetches.length, 1);
    assert.deepEqual(source.fetches[0], { offset: 10, length: 14 }); // 10..24
    assert.deepEqual(new Uint8Array(result[0]), new Uint8Array([10, 11, 12, 13]));
    assert.deepEqual(new Uint8Array(result[1]), new Uint8Array([20, 21, 22, 23]));
  });

  it('does not merge ranges with gap larger than coalesce', async () => {
    const source = new RecordingSource(makeBuffer(256));
    const result = await coalesceRanges(
      source,
      [
        { offset: 0, length: 4 }, // covers 0..4
        { offset: 100, length: 4 }, // covers 100..104, gap = 96
      ],
      { coalesce: 16 },
    );

    assert.equal(source.fetches.length, 2);
    assert.deepEqual(source.fetches[0], { offset: 0, length: 4 });
    assert.deepEqual(source.fetches[1], { offset: 100, length: 4 });
    assert.deepEqual(new Uint8Array(result[0]), new Uint8Array([0, 1, 2, 3]));
    assert.deepEqual(new Uint8Array(result[1]), new Uint8Array([100, 101, 102, 103]));
  });

  it('refuses to merge when the result would exceed maxRangeSize', async () => {
    const source = new RecordingSource(makeBuffer(1000));
    const result = await coalesceRanges(
      source,
      [
        { offset: 0, length: 100 }, // covers 0..100
        { offset: 110, length: 100 }, // covers 110..210, gap = 10, merged span = 210
      ],
      { coalesce: 32, maxRangeSize: 150 },
    );

    assert.equal(source.fetches.length, 2);
    assert.deepEqual(source.fetches[0], { offset: 0, length: 100 });
    assert.deepEqual(source.fetches[1], { offset: 110, length: 100 });
    assert.equal(result[0].byteLength, 100);
    assert.equal(result[1].byteLength, 100);
  });

  it('fetches a single oversized range in full (does not truncate input)', async () => {
    const source = new RecordingSource(makeBuffer(500));
    const result = await coalesceRanges(source, [{ offset: 0, length: 400 }], { maxRangeSize: 100 });

    assert.equal(source.fetches.length, 1);
    assert.deepEqual(source.fetches[0], { offset: 0, length: 400 });
    assert.equal(result[0].byteLength, 400);
  });

  it('handles duplicate input ranges by reusing the same merged group', async () => {
    const source = new RecordingSource(makeBuffer(64));
    const result = await coalesceRanges(source, [
      { offset: 5, length: 3 },
      { offset: 5, length: 3 },
    ]);

    assert.equal(source.fetches.length, 1);
    assert.deepEqual(new Uint8Array(result[0]), new Uint8Array([5, 6, 7]));
    assert.deepEqual(new Uint8Array(result[1]), new Uint8Array([5, 6, 7]));
  });

  it('handles overlapping input ranges', async () => {
    const source = new RecordingSource(makeBuffer(64));
    const result = await coalesceRanges(
      source,
      [
        { offset: 5, length: 10 }, // covers 5..15
        { offset: 10, length: 10 }, // covers 10..20, overlaps + extends
      ],
      { coalesce: 16 },
    );

    assert.equal(source.fetches.length, 1);
    assert.deepEqual(source.fetches[0], { offset: 5, length: 15 }); // 5..20
    assert.deepEqual(new Uint8Array(result[0]), new Uint8Array([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]));
    assert.deepEqual(new Uint8Array(result[1]), new Uint8Array([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]));
  });

  it('throws when source.fetch returns fewer bytes than requested', async () => {
    class TruncatingSource implements Source {
      url = new URL('memory://truncating');
      async fetch(_offset: number, length: number): Promise<ArrayBuffer> {
        const buf = new Uint8Array(length - 1);
        return buf.buffer as ArrayBuffer;
      }
    }
    const source = new TruncatingSource();

    await assert.rejects(
      () => coalesceRanges(source, [{ offset: 0, length: 10 }]),
      /Failed to fetch bytes from offset:0 wanted:10 got:9/,
    );
  });

  it('forwards AbortSignal to source.fetch', async () => {
    const seenSignals: (AbortSignal | undefined)[] = [];
    class SignalCapturingSource implements Source {
      url = new URL('memory://signal');
      async fetch(_offset: number, length: number, options?: { signal?: AbortSignal }): Promise<ArrayBuffer> {
        seenSignals.push(options?.signal);
        return new ArrayBuffer(length);
      }
    }
    const source = new SignalCapturingSource();
    const controller = new AbortController();

    await coalesceRanges(
      source,
      [
        { offset: 0, length: 4 },
        { offset: 100, length: 4 },
      ],
      { coalesce: 8, signal: controller.signal },
    );

    assert.equal(seenSignals.length, 2);
    for (const s of seenSignals) assert.equal(s, controller.signal);
  });

  it('caps in-flight source.fetch calls at 10', async () => {
    const source = new RecordingSource(makeBuffer(10_000));
    source.delayTicks = 5;

    const ranges = Array.from({ length: 25 }, (_, i) => ({ offset: i * 200, length: 4 }));
    await coalesceRanges(source, ranges, { coalesce: 8 });

    assert.equal(source.fetches.length, 25);
    assert.ok(source.peakInflight <= 10, `expected peakInflight <= 10, got ${source.peakInflight}`);
  });

  it('returns results in input order even when input is out of offset order', async () => {
    const source = new RecordingSource(makeBuffer(256));
    const result = await coalesceRanges(
      source,
      [
        { offset: 200, length: 4 },
        { offset: 0, length: 4 },
        { offset: 100, length: 4 },
      ],
      { coalesce: 8 },
    );

    assert.deepEqual(new Uint8Array(result[0]), new Uint8Array([200, 201, 202, 203]));
    assert.deepEqual(new Uint8Array(result[1]), new Uint8Array([0, 1, 2, 3]));
    assert.deepEqual(new Uint8Array(result[2]), new Uint8Array([100, 101, 102, 103]));
  });
});
